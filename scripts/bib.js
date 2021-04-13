import Cite from 'citation-js';
import { readFile } from 'fs/promises'
import yaml from 'yaml';

export class Bibliography {
  constructor() {
    this.taken = {}
    this.items = []
  }

  load(path) {
    let items
    const content = () => readFile(path)
    if (path.endsWith('.yaml')) {
      items = yaml.parse(content)
    } else if (path.endsWith('.json')) {
      items = JSON.parse(content)
    } else if (path.endsWith('.bib')) {
      items = Cite.input(content)
    } else {
      return false
    }
    items.forEach(item => console.log(item))
  }
}