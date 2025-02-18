import { describe, it, expect } from 'vitest'
import { Rule } from './thnkfile'

function generations({ target, deps, recipe }) {
  const rule = new Rule(target, deps, recipe.join('\n'))
  return [rule.generation()]
}

describe('generations', () => {
  it('should throw an error if multiple schema.json files are provided', () => {
    const rule = {
      target: 'output.txt',
      deps: ['file1.txt', 'file2.txt', 'schema.json', 'schema.json'],
      recipe: [],
    }
    expect(() => {
      ;[...generations(rule)]
    }).to.throw('Multiple schema.json files')
  })

  it('should throw an error if multiple prompt.md files are provided', () => {
    const rule = {
      target: 'output.txt',
      deps: ['file1.txt', 'file2.txt', 'prompt.md', 'prompt.md'],
      recipe: [],
    }
    expect(() => {
      ;[...generations(rule)]
    }).to.throw('Multiple prompt.md files')
  })

  it('should throw an error if both inline prompt and prompt file are provided', () => {
    const rule = {
      target: 'output.txt',
      deps: ['file1.txt'],
      recipe: ['Inline prompt'],
    }
    const promptFile = 'prompt.md'
    expect(() => {
      ;[...generations({ ...rule, deps: [...rule.deps, promptFile] })]
    }).to.throw('Cannot have prompt both in file and in Thnkfile')
  })

  it('should yield a text config when target is not a JSON file', function* () {
    const rule = {
      target: 'output.txt',
      deps: ['file1.txt', 'file2.txt'],
      recipe: [],
    }
    const result = [...generations(rule)]
    expect(result).to.have.lengthOf(1)
    expect(result[0]).to.have.property('type', 'text')
  })

  it('should yield a json config when target is a JSON file', function* () {
    const rule = {
      target: 'output.json',
      deps: ['file1.txt', 'file2.txt', 'schema.json'],
      recipe: [],
    }
    const result = [...generations(rule)]
    expect(result).to.have.lengthOf(1)
    expect(result[0]).to.have.property('type', 'json')
  })

})
