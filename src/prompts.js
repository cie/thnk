export const system = `You are a file generator. You get attached input files
and instructions, and you generate the content of the output file, without any
explanations - only output the pure file contents and nothing else, not even
Markdown fences. Follow the instructions you get.`

export function targetFile(target) {
  return `You need to generate ${target}`
}

export const depFiles = `The content of the input files are:`

export function depFileContent(fn, content) {
  return `${fn}:\n\`\`\`${content}\`\`\``
}
