#!/usr/bin/env node
// @ts-check
import prince from 'prince';
import fs from 'fs/promises';
import md from './scripts/markdown.js';
import esbuild from './scripts/esbuild.js';
import yaml from 'yaml';

const t0 = Date.now()

function task(name,t) {
  console.log('\x1b[32m[start]\x1b[0m ' + name)
  const taskT0 = Date.now()
  if (typeof t == 'function') {
    try {
      const res = t()
      console.log(`\x1b[32m[done]\x1b[0m ${name} (${Date.now() - taskT0}ms)`)
      return res
    } catch (e) {      
      console.log('\x1b[31m[failed]\x1b[0m ' + name + ": \n" + e)    
      throw e
    }
  } else {
    return t.then(r => {
      console.log(`\x1b[32m[done]\x1b[0m ${name} (${Date.now() - taskT0}ms)`)
      return r
    },(e) => {
      console.log('\x1b[31m[failed]\x1b[0m ' + name + ": \n" + e)
      throw e
    })
  }
}

const src = task('load markdown sources',
  fs.readdir('src',{ withFileTypes: true })
    .then(dir => 
      Promise.all(dir
        .filter(file => file.isFile && file.name.endsWith('.md'))
        .map(file => fs.readFile('src/' + file.name).then(x => x.toString('utf-8')))
      ).then(files => files.join('\n')
    ))
)

let bib = task('load bibliography',
  fs.readFile('src/bib/bib.yaml').then(f => yaml.parse(f.toString('utf-8')))
)

const style = task('load citation style',
  fs.readFile('src/bib/ieee.csl').then(f => f.toString('utf-8'))
)

const cites = [];

const cssOut = [];

const markdown = Promise.all([bib,style]).then(([bib,style]) => {
  return md({
    typographer: true,
    html: true,
    csl: {
      bib,
      style
    },
    cssOut
  })
})

const html = Promise.all([src,markdown]).then(([src,md]) => task('building markdown',() => md.render(src)))

const es = task('building javascript and css', esbuild())

const out = html.then((html) => task('write html output',fs.writeFile('build/index.html', html, { encoding: 'utf-8' })))

await Promise.all([es,out]).then(() => 
  task('building pdf', prince()  
    .inputs("build/index.html")
    .output("build/index.pdf")
    .execute())
)

console.log(`\x1b[32m[success]\x1b[0m after ${Date.now() - t0}ms`)