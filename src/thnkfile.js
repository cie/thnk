import { existsSync, readFileSync, statSync } from 'fs'
import {
  jsonSchema,
  streamText,
  streamObject,
  generateText,
  generateObject,
} from 'ai'
import yaml, { JSON_SCHEMA, Type } from 'js-yaml'
import * as prompts from './prompts.js'
import { z } from 'zod'
import { openai } from '@ai-sdk/openai'
import { Liquid } from 'liquidjs'
import { Template } from './model/Template.js'

const GenerationSchema = z.object({
  prompt: z.union([z.string(), z.instanceof(Template)]).optional(),
  schema: z.object({}).passthrough().optional(),
  model: z.string().optional().default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).optional().default(0.0),
})

const ComputationSchema = z.object({
  content: z.union([z.string(), z.instanceof(Template)]),
})

const TargetSchema = z
  .object({
    needs: z.array(z.string()).optional().default([]),
    data: z.object({}).passthrough().optional(),
  })
  .and(ComputationSchema.or(GenerationSchema))

const ThnkfileSchema = z
  .object({
    targets: z.record(z.string(), TargetSchema),
    data: z.object({}).passthrough().optional(),
  })
  .merge(GenerationSchema)

const TEMPLATE_ENGINE = new Liquid({
  strictFilters: true,
  strictVariables: true,
  cache: true,
  outputEscape: false,
})

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
    new Type('!liquid', {
      kind: 'scalar',
      construct(template) {
        return new Template((data) => {
          return TEMPLATE_ENGINE.parseAndRenderSync(template, data)
        })
      },
    }),
    new Type('!handlebars', {
      kind: 'scalar',
      construct(_template) {
        throw new Error(
          '!handlebars tag is no longer supported. Use !liquid instead.'
        )
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
      const global = GenerationSchema.parse(config)

      for (const [targetName, target] of Object.entries(config.targets)) {
        const { needs, ...options } = target
        try {
          this.rules.push(
            new Rule(targetName, needs, {
              ...global,
              ...options,
              data: { ...global.data, ...options.data },
            })
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
  /**
   * @param {string} target
   * @param {z.infer<typeof GenerationSchema>} options
   */
  constructor(target, needs, options) {
    this.target = target
    this.needs = needs
    this.options = options
  }

  get isNoOp() {
    return !this.options.prompt && !this.options.content
  }

  get isJSON() {
    return this.target.endsWith('.json') && !!this.options.schema
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

  generation(runtimeOpts = {}) {
    const { target } = this
    const options = {
      ...this.options,
      ...runtimeOpts,
      data: { ...this.options.data, ...runtimeOpts.data },
    }

    if (this.options.content) {
      let { content, data } = this.options
      if (content instanceof Template) {
        content = content.apply(data)
      }
      return content
    }

    const { model, temperature, schema, data } = options
    // Process prompt if it's a Liquid template
    let { prompt, system } = options
    if (prompt instanceof Template) {
      prompt = prompt.apply(data)
    }
    if (system instanceof Template) {
      system = system.apply(data)
    }
    const config = {
      model: openai(model),
      temperature,
      system:
        system ??
        prompts.system(
          target,
          Object.fromEntries(this.needs.map((fn) => [fn, readFileSync(fn)]))
        ),
      prompt: prompt ?? '',
    }

    if (this.isJSON) {
      return new ObjectGeneration(target, {
        ...config,
        output: 'object',
        schema: jsonSchema(schema),
      })
    } else {
      return new TextGeneration(target, config)
    }
  }
}

export class TextGeneration {
  type = 'text'

  constructor(target, config) {
    this.target = target
    this.config = config
  }

  async text() {
    return (await generateText(this.config)).text
  }

  stream() {
    return streamText(this.config)
  }
}

export class ObjectGeneration {
  type = 'json'

  constructor(target, config) {
    this.target = target
    this.config = config
  }

  async object() {
    return (await generateObject(this.config)).object
  }

  async text() {
    const object = await this.object()
    return JSON.stringify(object, undefined, 2)
  }

  stream() {
    return streamObject(this.config)
  }
}
