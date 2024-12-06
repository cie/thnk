#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'fs'
import { generateText, generateObject } from 'ai'
import { dirname } from 'path'
import { readThnkfile, parseThnkfile, rules } from './src/thnkfile.js'
import { generations } from './src/generation.js'
import { parseArgs } from 'util'

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

const THNKFILE_NAME = 'Thnkfile'

console.debug = () => {}

let fileCount = 0
const src = readThnkfile(THNKFILE_NAME)
const ast = parseThnkfile(src)

for (const rule of rules(ast)) {
  const { target } = rule
  if (targets.length && !targets.includes(target)) {
    continue
  }
  for (const generation of generations(rule, options)) {
    ++fileCount
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
