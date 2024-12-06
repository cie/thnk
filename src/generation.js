import { existsSync, readFileSync, statSync } from 'fs'
import { jsonSchema } from 'ai'
import * as prompts from './prompts.js'

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
let model
if (process.env.OPENAI_API_KEY) {
  model = (await import('@ai-sdk/openai')).openai(
    process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL
  )
} else {
  throw new Error('set OPENAI_API_KEY')
}

const SPECIAL_FILE = /(^|\.)(thnkfile|schema\.json|prompt\.md)$/i
const temperature = 0

export function* generations(rule, options) {
  const { target } = rule
  const targetStat = existsSync(target) ? statSync(target) : undefined
  const deps = rule.deps.filter((d) => !d.match(SPECIAL_FILE))
  const specials = rule.deps.filter((d) => d.match(SPECIAL_FILE))
  const schemaFiles = specials.filter((d) => d.match(/(^|\.)schema\.json$/))
  const promptFiles = specials.filter((d) => d.match(/(^|\.)prompt\.md$/))

  if (schemaFiles.length > 1) throw new Error('Multiple schema.json files')
  const schemaFile = schemaFiles.at(0)

  if (promptFiles.length > 1) throw new Error('Multiple prompt.md files')
  const promptFile = promptFiles.at(0)
  const inlinePrompt = rule.recipe.join('\n').trim()

  if (inlinePrompt && promptFile) {
    throw new Error('Cannot have prompt both in file and in Thnkfile')
  }

  const depStats = [...deps, ...specials].map((d) => statSync(d))
  const prompt = inlinePrompt || readFileSync(promptFile).toString()

  if (!options['always-thnk']) {
    if (targetStat && depStats.every((d) => d.mtimeMs < targetStat.mtimeMs)) {
      return
    }
  }

  console.log(`Thnking ${target}...`)

  const depContents = Object.fromEntries(
    deps.map((fn) => [fn, readFileSync(fn)])
  )

  const config = {
    model,
    system: prompts.system(target, depContents),
    temperature,
    prompt,
  }

  console.debug(deps)
  console.debug(config.system)
  console.debug(prompt)

  if (target.endsWith('.json') && schemaFile) {
    let schema
    try {
      schema = JSON.parse(readFileSync(schemaFile))
    } catch (error) {
      console.error(`Error processing schema file ${schemaFile}:`, error)
      process.exit(1)
    }
    yield {
      type: 'json',
      config: {
        ...config,
        output: 'object',
        schema: jsonSchema(schema),
      },
    }
  } else {
    yield { type: 'text', config }
  }
}
