import { existsSync, readFileSync, statSync } from 'fs'

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
const system = `You are a file generator. You get attached input files and instructions, and you generate the content of the output file, without any explanations - only output the pure file contents and nothing else, not even Markdown fences. Follow the instructions you get.`
const temperature = 0

export function* generations(rule) {
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
