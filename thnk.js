#!/usr/bin/env node
import { readFileSync, statSync, writeFileSync, existsSync } from 'fs'
import makefileParser from '@kba/makefile-parser'
import { generateText, generateObject, jsonSchema } from 'ai'

let model
if (process.env.OPENAI_API_KEY) {
  model = (await import('@ai-sdk/openai')).openai(
    process.env.OPENAI_MODEL ?? 'gpt-4-turbo'
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
    let deps = node.deps
    const depStats = deps.map((d) => statSync(d))
    const prompt = node.recipe.join('\n')
    if (!targetStat || depStats.some((d) => d.mtimeMs > targetStat.mtimeMs)) {
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
        const schemaName = target.replace(/\.json$/, '.schema.json')
        if (!deps.includes(schemaName))
          throw new Error(
            `Include a JSON schema ${schemaName} in deps of ${target}`
          )
        const schema = JSON.parse(readFileSync(schemaName))
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

console.log(count ? `Thght ${count} files.` : `All files thght.`)
