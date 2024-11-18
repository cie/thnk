#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'fs'
import { generateText, generateObject, jsonSchema } from 'ai'
import { dirname } from 'path'
import { readThnkfile, parseThnkfile, rules } from './src/thnkfile.js'
import { generations } from './src/generation.js'

const THNKFILE_NAME = 'Thnkfile'

console.debug = () => {}

let fileCount = 0
const src = readThnkfile(THNKFILE_NAME)
const ast = parseThnkfile(src)

for (const rule of rules(ast)) {
  const { target } = rule
  for (const generation of generations(rule)) {
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
