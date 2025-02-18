import { existsSync, readFileSync, statSync } from 'fs'
import { jsonSchema } from 'ai'
import * as prompts from './prompts.js'

export function* generations(thnkfile, options) {
  const { target, deps, normalDeps, inlinePrompt, schemaFile, promptFile } = rule
  const force = options['always-thnk']
  const plan = 

  console.log(`Thnking ${target}...`)


}
