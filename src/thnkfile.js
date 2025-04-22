import { existsSync, readFileSync, statSync } from 'fs'
import { jsonSchema } from 'ai'
import yaml, { JSON_SCHEMA, Type } from 'js-yaml'
import { z } from 'zod'
import { openai } from '@ai-sdk/openai'

const SettingsSchema = z.object({
  prompt: z.string().optional(),
  schema: z.object({}).passthrough().optional(),
  model: z.string().optional().default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).optional().default(0.0),
})

const TargetSchema = z
  .object({
    needs: z.array(z.string()).optional().default([]),
  })
  .merge(SettingsSchema)

const ThnkfileSchema = z
  .object({
    targets: z.record(z.string(), TargetSchema),
  })
  .merge(SettingsSchema)

const YAML_SCHEMA = JSON_SCHEMA.extend({
  explicit: [
    new Type('!file', {
      kind: 'scalar',
      construct(fn) {
        const content = readFileSync(fn, 'utf-8')
        if (fn.match(/\.json$/i)) {
          return JSON.parse(content)
        }
        if (fn.match(/\.ya?ml$/i)) {
          return yaml.load(content, { schema: JSON_SCHEMA })
        }
        return content
      },
    }),
  ],
})

export class Thnkfile {
  /** @type {Rule[]} */
  rules = []

  /**
   * @param {string} src
   */
  constructor(src) {
    try {
      const raw = yaml.load(src, { schema: YAML_SCHEMA })
      const config = ThnkfileSchema.parse(raw)
      const globalSettings = SettingsSchema.parse(config)

      for (const [targetName, targetConfig] of Object.entries(config.targets)) {
        try {
          this.rules.push(
            new Rule(targetName, { ...globalSettings, ...targetConfig })
          )
        } catch (e) {
          e.message = `Error in target ${targetName}: ${e.message}`
          throw e
        }
      }
    } catch (e) {
      if (e.name === 'YAMLException') {
        throw new Error(`YAML parsing error: ${e.message}`)
      } else if (e.name === 'ZodError') {
        throw new Error(
          `Validation error: ${e.errors
            .map((err) => `${err.path.join('.')}: ${err.message}`)
            .join(', ')}`
        )
      }
      throw e
    }
  }

  get defaultTarget() {
    if (this.rules.length === 0) throw new Error('No rules in Thnkfile')
    return this.rules[0].target
  }

  plan(target = this.defaultTarget, force = false) {
    const thnk = (target, force = false) => {
      const rule = this.ruleFor(target)
      if (!rule) {
        if (existsSync(target)) return []
        throw new Error(`No rule for target ${target}`)
      }
      let upstreamSteps = []
      for (const need of rule.needs) {
        const newSteps = thnk(need)
        upstreamSteps = [
          ...upstreamSteps,
          ...newSteps.filter((s) => !upstreamSteps.includes(s)),
        ]
      }
      if (!force && upstreamSteps.length === 0 && rule.isCacheHit()) return []
      return [...upstreamSteps, ...(rule.isNoOp ? [] : [rule])]
    }
    return thnk(target, force)
  }

  ruleFor(target) {
    return this.rules.find((r) => r.canMake(target))
  }
}

/**
 * @implements {z.infer<typeof SettingsSchema>}
 */
export class Rule {
  opts
  /**
   * @param {string} target
   * @param {z.infer<typeof TargetSchema>} opts
   */
  constructor(target, opts) {
    this.target = target
    Object.assign(this, opts)
    // Will be updated when promptFile is set
    this.isNoOp = !this.prompt
  }

  get isJSON() {
    return this.target.endsWith('.json') && !!this.schema
  }

  canMake(target) {
    return this.target === target
  }

  isCacheHit() {
    if (!existsSync(this.target)) return false
    const targetStat = statSync(this.target)
    return this.needs.every((need) => {
      const needstat = existsSync(need) ? statSync(need) : undefined
      return needstat && needstat.mtimeMs <= targetStat.mtimeMs
    })
  }

  generation(prompts) {
    // Use target-specific model and temperature if defined, otherwise use provided values
    const { model, temperature, prompt, target, schema } = this
    const normalDepContents = Object.fromEntries(
      this.needs.map((fn) => [fn, readFileSync(fn)])
    )
    const config = {
      model: openai(model),
      system: prompts.system(target, normalDepContents),
      temperature,
      prompt,
    }

    if (this.isJSON) {
      return {
        type: 'json',
        config: {
          ...config,
          output: 'object',
          schema: jsonSchema(schema),
        },
      }
    } else {
      return { type: 'text', config }
    }
  }
}
