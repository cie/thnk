#!/usr/bin/env node
import {
  readFileSync,
  statSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from 'fs'
import makefileParser from '@kba/makefile-parser'
import { generateText, generateObject, jsonSchema } from 'ai'
import { dirname } from 'path'

const SPECIAL_FILE = /(^|\.)(thnkfile|schema\.json|prompt\.md)$/i
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const THNKFILE_NAME = 'Thnkfile'

let model
if (process.env.OPENAI_API_KEY) {
  model = (await import('@ai-sdk/openai')).openai(
    process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL
  )
} else {
  throw new Error('set OPENAI_API_KEY')
}

const system = `You are a file generator. You get attached input files and instructions, and you generate the content of the output file, without any explanations - only output the pure file contents and nothing else, not even Markdown fences. Follow the instructions you get.`
const temperature = 0

console.debug = () => {}

function readAndParseThnkfile(fileName) {
  let src
  try {
    src = readFileSync(fileName, 'utf8')
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error)
    process.exit(1)
  }
  src = src.replace(/\r\n/g, '\n').replace(/^[ \t]+/gm, '\t')
  try {
    return makefileParser(src, { strict: true }).ast
  } catch (error) {
    console.error(`Error parsing ${fileName}:`, error)
    process.exit(1)
  }
}

function* rules(ast) {
  for (const node of ast) {
    if ('target' in node) {
      yield node
    }
  }
}

function* generations(rule) {
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
  const depStats = [...deps, ...specials].map((d) => statSync(d))
  const inlinePrompt = rule.recipe.join('\n').trim()

  if (inlinePrompt && promptFile) {
    throw new Error('Cannot have prompt both in file and in Thnkfile')
  }

  const prompt = inlinePrompt || readFileSync(promptFile).toString()

  if (!targetStat || depStats.some((d) => d.mtimeMs >= targetStat.mtimeMs)) {
    console.log(`Thnking ${target}...`)
    ++fileCount
    let result
    const config = {
      model,
      system:
        system +
        `\n\nYou need to generate ${target}` +
        '\n\nThe content of the input files are: \n\n' +
        deps
          .map((fn) => {
            return `${fn}:\n\`\`\`${readFileSync(fn)}\`\`\``
          })
          .join('\n\n'),
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
}

let fileCount = 0
const ast = readAndParseThnkfile(THNKFILE_NAME)

for (const rule of rules(ast)) {
  const { target } = rule
  for (const generation of generations(rule)) {
    let result
    switch (generation.type) {
      case 'text': {
        const { config } = generation
        result = (await generateText(config)).text
        break
      }
      case 'json': {
        const { config } = generation
        result = JSON.stringify(
          (await generateObject(config)).object,
          undefined,
          2
        )
        break
      }
    }
    try {
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, result)
    } catch (error) {
      console.error(`Error writing to target file ${target}:`, error)
      process.exit(1)
    }
  }
}

console.log(fileCount ? `Thgt ${fileCount} files.` : `All files thgt.`)
