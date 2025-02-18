#!/usr/bin/env node
import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { generateText, generateObject } from 'ai'
import { dirname } from 'path'
import { Thnkfile } from './src/thnkfile.js'
import { parseArgs } from 'util'
import * as prompts from './src/prompts.js'

const { positionals: targets, values: options } = parseArgs({
  options: {
    'always-thnk': {
      type: 'boolean',
      short: 'B',
    },
  },
  strict: true,
  allowPositionals: true,
})

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
let model
if (process.env.OPENAI_API_KEY) {
  model = (await import('@ai-sdk/openai')).openai(
    process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL
  )
} else {
  throw new Error('please set OPENAI_API_KEY')
}

const temperature = 0

const THNKFILE_NAME = 'Thnkfile'

console.debug = () => { }

let src
try {
  src = readFileSync(THNKFILE_NAME, 'utf8')
} catch (error) {
  console.error(`Error reading ${THNKFILE_NAME}:`, error)
  process.exit(1)
}

const thnkfile = new Thnkfile(src)

const target = targets[0] ?? undefined

const force = options['always-thnk']
const plan = thnkfile.plan(target, force)
if (!plan.length) {
  console.log('All files thgt.')
  process.exit(0)
}

console.log(`Planning to thnk:\n${plan.map(r => r.target).join('\n')}`)

let fileCount = 0
for (const rule of plan) {
  const { target } = rule
  const generation = rule.generation({ model, prompts, temperature })
  ++fileCount
  let result
  console.log(`Thnking ${target}...`)
  switch (generation.type) {
    case 'text': {
      const { config } = generation
      result = (await generateText({ ...config })).text
      break
    }
    case 'json': {
      const { config } = generation
      result = JSON.stringify(
        (await generateObject({ ...config })).object,
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

console.log(`Thgt ${fileCount} files.`)
