import makefileParser from '@kba/makefile-parser'
import { readFileSync } from 'fs'

export function readThnkfile(fileName) {
  let src
  try {
    src = readFileSync(fileName, 'utf8')
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error)
    process.exit(1)
  }
  return src
}

export function parseThnkfile(src) {
  src = src.replace(/\r\n/g, '\n').replace(/^[ \t]+/gm, '\t')
  try {
    return makefileParser(src, { strict: true }).ast
  } catch (error) {
    console.error(`Error parsing thnkfile:`, error)
    process.exit(1)
  }
}

export function* rules(ast) {
  for (const node of ast) {
    if ('target' in node) {
      yield node
    }
  }
}
