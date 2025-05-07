import { Thnkfile } from './src/thnkfile.js'
import { readFileSync } from 'fs'

export class Thnk {
  constructor(thnkfileName = 'Thnkfile.yml') {
    this.thnkfile = new Thnkfile(readFileSync(thnkfileName, 'utf8'))
  }

  async text(target, options = {}) {
    const plan = this.thnkfile.plan(target)
    const contents = new Map()
    for (const rule of plan) {
      contents.set(rule.target, await rule.generation(options).text())
    }
    return contents.get(target)
  }

  async object(target, options = {}) {
    const plan = this.thnkfile.plan(target)
    if (!plan.at(-1).isJSON) {
      throw new Error('Target is not a JSON target')
    }
    const contents = new Map()
    for (const rule of plan) {
      contents.set(rule.target, await rule.generation(options).object())
    }
    return contents.get(target)
  }
}
export default Thnk
