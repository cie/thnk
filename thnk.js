#!/usr/bin/env node
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
import { streamObject, streamText, generateText, generateObject } from 'ai'
import { dirname } from 'path'
import { Thnkfile } from './src/thnkfile.js'
import { parseArgs } from 'util'
import * as prompts from './src/prompts.js'
import { displayProgress } from './src/displayProgress.js'

const { positionals: targets, values: options } = parseArgs({
  options: {
    'always-thnk': {
      type: 'boolean',
      short: 'B',
    },
    interactive: {
      type: 'boolean',
      short: 'i',
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

const THNKFILE_NAME = 'Thnkfile.yml'

//console.debug = () => { }

/**
 * Main function to run the thnk process
 * @param {string[]} targetArgs - Target arguments
 * @param {Object} runOptions - Run options
 * @returns {number} - Number of files processed
 */
async function runThnk(targetArgs, runOptions) {
  let src
  try {
    src = readFileSync(THNKFILE_NAME, 'utf8')
  } catch (error) {
    console.error(`Error reading ${THNKFILE_NAME}:`, error)
    process.exit(1)
  }

  const thnkfile = new Thnkfile(src)
  const target = targetArgs[0] ?? thnkfile.defaultTarget
  const force = runOptions['always-thnk']
  const plan = thnkfile.plan(target, force)

  if (!plan.length) {
    console.log(`Already thgt ${target}`)
    return 0
  }

  console.log(`Need to thnk ${plan.map((r) => r.target).join(' ')}`)

  let fileCount = 0
  for (const rule of plan) {
    const { target } = rule
    const generation = rule.generation(prompts)
    ++fileCount
    let { config } = generation
    if (existsSync(target)) {
      const existingContent = readFileSync(target, 'utf8')
      config = {
        ...config,
        providerOptions: {
          openai: {
            prediction: {
              type: 'content',
              content: existingContent,
            },
          },
        },
      }
    }
    let result
    let lineHead = `Thnking ${target}... `
    process.stderr.write(lineHead)
    switch (generation.type) {
      case 'text': {
        const { text, fullStream } = streamText({ ...config })
        await displayProgress(fullStream, lineHead)
        result = await text
        break
      }
      case 'json': {
        if (config.providerOptions?.openai?.prediction) {
          // prediction is not supported with tools
          delete config.providerOptions.openai.prediction
        }
        const { object, fullStream } = streamObject({ ...config })
        await displayProgress(fullStream, lineHead)
        result = JSON.stringify(await object, undefined, 2)
        break
      }
    }
    process.stderr.write('\n')
    try {
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, result)
    } catch (error) {
      console.error(`Error writing to target file ${target}:`, error)
      process.exit(1)
    }
  }

  console.log(`Thgt ${fileCount} file${fileCount === 1 ? '' : 's'}.`)
  return fileCount
}

/**
 * Run in interactive mode, re-running on Enter key press
 * @param {string[]} targetArgs - Target arguments
 * @param {Object} runOptions - Run options
 */
async function runInteractive(targetArgs, runOptions) {
  // Run once initially
  await runThnk(targetArgs, runOptions)
  console.log('Press Enter to rethnk, Ctrl+C to exit')

  // Set up stdin for interactive mode
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')

  process.stdin.on('data', async (key) => {
    // Ctrl+C (ASCII code 3) to exit
    if (key === '\u0003') {
      console.log('Bye')
      process.exit(0)
    }

    // Enter key to re-run
    if (key === '\r' || key === '\n') {
      await runThnk(targetArgs, runOptions)
      console.log('Press Enter to rethnk, Ctrl+C to exit')
    }
  })
}

// Main execution
;(async () => {
  const interactive = options['interactive']

  if (interactive) {
    await runInteractive(targets, options)
  } else {
    const fileCount = await runThnk(targets, options)
    if (fileCount === 0) {
      process.exit(0)
    }
  }
})()
