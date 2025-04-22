import { describe, it, expect } from 'vitest'
import { Rule } from './thnkfile'
import * as prompts from './prompts'

describe('generations', () => {
  it('should yield a text config when target is not a JSON file', function () {
    const rule = new Rule('output.txt', {
      needs: ['examples/hello/person_name.txt'],
      prompt: '',
    })
    const result = [rule.generation(prompts)]
    expect(result).to.have.lengthOf(1)
    expect(result[0]).to.have.property('type', 'text')
  })

  it('should yield a json config when target is a JSON file and there is a schema', function () {
    const rule = new Rule('output.json', {
      target: 'output.json',
      needs: ['examples/hello/person_name.txt'],
      schema: {},
    })
    const result = [rule.generation(prompts)]
    expect(result).to.have.lengthOf(1)
    expect(result[0]).to.have.property('type', 'json')
  })
})
