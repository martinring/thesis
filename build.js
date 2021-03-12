#!/usr/bin/env node
// @ts-check
import prince from 'prince';
import fs from 'fs/promises';
import md from './scripts/markdown.js';
import esbuild from './scripts/esbuild.js';
import yaml from 'yaml';
import * as log from './scripts/log.js';

const t0 = Date.now()

const src = log.timed('load markdown sources',
  fs.readdir('src',{ withFileTypes: true })
    .then(dir => 
      Promise.all(dir
        .filter(file => file.isFile && file.name.endsWith('.md'))
        .map(file => fs.readFile('src/' + file.name).then(x => x.toString('utf-8')))
      ).then(files => files.join('\n')
    ))
)

let bib = log.timed('load bibliography',
  fs.readFile('src/bib/bib.yaml').then(f => yaml.parse(f.toString('utf-8')))
)

const style = log.timed('load citation style',
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

const html = Promise.all([src,markdown]).then(([src,md]) => log.timed('building markdown',() => md.render(src)))

const es = log.timed('building javascript and css', esbuild())

const out = html.then((html) => log.timed('write html output',fs.writeFile('build/index.html', html, { encoding: 'utf-8' })))

await Promise.all([es,out]).then(() => 
  log.timed('building pdf', prince()    
    .inputs("build/index.html")
    .output("build/index.pdf")    
    .execute())
)

log.info(`total time ${Date.now() - t0}ms`)