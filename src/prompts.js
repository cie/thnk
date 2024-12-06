export const system = (target, depContents) => `Given the following input files:
${fileContents(depContents)}
, generate ${target} based on the instructions you get. Output only the raw file contents, no explanations, no markdown fences around.`

function fileContents(depContents) {
  return Object.entries(depContents)
    .map(
      ([fn, content]) => `${fn}:
\`\`\`
${content}
\`\`\``
    )
    .join('\n\n')
}
