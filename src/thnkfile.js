import makefileParser from '@kba/makefile-parser'
import { exists, existsSync, readFileSync, statSync } from 'fs'

export class Thnkfile {
  /** @type {Rule[]} */
  rules = []

  /**
   * @param {string} src 
   */
  constructor(src) {
    src = src.replace(/\r\n/g, '\n').replace(/^[ \t]+/gm, '\t')
    const ast = makefileParser(src, { strict: true }).ast
    for (const node of ast) {
      if ('target' in node) {
        const { target, deps, recipe } = node
        try {
          this.rules.push(new Rule(target, deps, recipe.join('\n').trim()))
        } catch (e) {
          e.message = `Error in rule ${target}: ${e.message}`
          throw e
        }
      }
    }
  }

  get defaultTarget() {
    if (this.rules.length === 0) throw new Error('No rules in Thnkfile')
    return this.rules[0].target
  }

  plan(target = this.defaultTarget, force = false) {
    const steps = []
    const visited = new Set()
    const thnk = (target, force = false) => {
      if (visited.has(target)) return
      visited.add(target)
      const rule = this.ruleFor(target)
      if (!rule) {
        if (existsSync(target)) return
        throw new Error(`No rule for target ${target}`)
      }
      if (!force && rule.cacheHit()) return
      for (const dep of rule.deps) {
        thnk(dep)
      }
      steps.push(rule)
    }
    thnk(target, force)
    return steps
  }

  ruleFor(target) {
    return this.rules.find((r) => r.canMake(target))
  }
}

const SPECIAL_FILE = /(^|\.)(thnkfile|schema\.json|prompt\.md)$/i
const SCHEMA_FILE = /(^|\.)(schema\.json)$/i
const PROMPT_FILE = /(^|\.)(prompt\.md)$/i
const THNKFILE = /(^|\.)(thnkfile)$/i

export class Rule {
  /**
   * @param {string} target 
   * @param {string[]} deps 
   * @param {string} inlinePrompt 
   */
  constructor(target, deps, inlinePrompt) {
    this.target = target
    this.deps = deps
    this.inlinePrompt = inlinePrompt.trim()
    this.normalDeps = deps.filter((d) => !d.match(SPECIAL_FILE))
    this.specialDeps = deps.filter((d) => d.match(SPECIAL_FILE))
    const schemaFiles = this.specialDeps.filter((d) => d.match(SCHEMA_FILE))
    const promptFiles = this.specialDeps.filter((d) => d.match(PROMPT_FILE))
    this.isJSON = target.endsWith('.json')

    if (schemaFiles.length > 1) throw new Error('Multiple schema.json files')
    this.schemaFile = schemaFiles.at(0)
    if (promptFiles.length > 1) throw new Error('Multiple prompt.md files')
    this.promptFile = promptFiles.at(0)

    if (this.inlinePrompt && this.promptFile) {
      throw new Error('Cannot have prompt both in file and in Thnkfile')
    }
    if (!this.inlinePrompt && !this.promptFile) {
      throw new Error('No prompt provided')
    }
    if (!this.isJSON && this.schemaFile) {
      throw new Error('Schema file provided for non-JSON target')
    }
  }

  canMake(target) {
    return this.target === target
  }

  cacheHit() {
    if (!existsSync(this.target)) return false
    const targetStat = statSync(this.target)
    return this.deps.every((dep) => {
      const depStat = existsSync(dep) ? statSync(dep) : undefined
      return depStat && depStat.mtimeMs <= targetStat.mtimeMs
    })
  }

  generation({ model, prompts, temperature }) {
    const { target, schemaFile, inlinePrompt, promptFile } = this
    const normalDepContents = Object.fromEntries(
      this.normalDeps.map((fn) => [fn, readFileSync(fn)])
    )
    const prompt = inlinePrompt || readFileSync(promptFile).toString()
    const config = {
      model,
      system: prompts.system(target, normalDepContents),
      temperature,
      prompt,
    }

    if (target.endsWith('.json') && schemaFile) {
      let schema
      try {
        schema = JSON.parse(readFileSync(schemaFile))
      } catch (error) {
        console.error(`Error processing schema file ${schemaFile}:`, error)
        process.exit(1)
      }
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
