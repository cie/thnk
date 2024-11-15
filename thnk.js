#!/usr/bin/env node
import { readFileSync, statSync, writeFileSync, existsSync } from 'fs'
import makefileParser from '@kba/makefile-parser'
import { generateText, generateObject, jsonSchema } from 'ai'

const SPECIAL_FILE =
  /(\.schema\.json|\.prompt\.md|\.thnk\.[a-z_]+|(^|\.)thnkfile)$/i

let model
if (process.env.OPENAI_API_KEY) {
  model = (await import('@ai-sdk/openai')).openai(
    process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  )
} else {
  throw new Error('set OPENAI_API_KEY')
}

console.log('Thnking...')

const system =
  'You are a file generator. You get attached input files and instructions, and you generate the content of the output file, without any explanations. Follow the instructions.'
const temperature = 0

const src = readFileSync('Thnkfile', 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/^\s+/gm, '\t')

let count = 0
for (const node of makefileParser(src, { strict: true }).ast) {
  if ('target' in node) {
    const { target } = node
    const targetStat = existsSync(target) ? statSync(target) : undefined
    const deps = node.deps.filter((d) => !d.match(SPECIAL_FILE))
    const specials = node.deps.filter((d) => d.match(SPECIAL_FILE))
    const schemaFiles = specials.filter((d) => d.match(/(^|\.)schema\.json$/))
    if (schemaFiles.length > 1) throw new Error('Multiple schema.json files')
    const schemaFile = schemaFiles.at(0)
    const promptFiles = specials.filter((d) => d.match(/(^|\.)prompt\.md$/))
    if (promptFiles.length > 1) throw new Error('Multiple prompt.md files')
    const promptFile = promptFiles.at(0)
    const depStats = [...deps, ...specials].map((d) => statSync(d))
    const inlinePrompt = node.recipe.join('\n').trim()
    if (inlinePrompt && promptFile)
      throw new Error('Cannot have prompt both in file and in Thnkfile')
    const prompt = inlinePrompt || readFileSync(promptFile).toString()
    if (!targetStat || depStats.some((d) => d.mtimeMs >= targetStat.mtimeMs)) {
      ++count
      let result
      const config = {
        model,
        system:
          system +
          '\n\nThe content of the input files are: \n\n' +
          deps
            .map((fn) => {
              return `${fn}:\n\`\`\`${readFileSync(fn)}\`\`\``
            })
            .join('\n\n'),
        temperature,
        prompt,
      }
      if (target.endsWith('.json')) {
        const schema = JSON.parse(readFileSync(schemaFile))
        result = JSON.stringify(
          (
            await generateObject({
              ...config,
              output: 'object',
              schema: jsonSchema(schema),
            })
          ).object,
          undefined,
          2
        )
      } else {
        result = (await generateText(config)).text
      }
      writeFileSync(target, result)
    }
  }
}

console.log(count ? `Thgt ${count} files.` : `All files thgt.`)
