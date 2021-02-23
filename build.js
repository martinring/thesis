#!/usr/bin/env node
// @ts-check
import prince from 'prince';
import fs from 'fs/promises';
import md from 'markdown-it';
import md_spans from 'markdown-it-bracketed-spans';
import md_attrs from 'markdown-it-attrs';
import md_figures from './scripts/images.js';
import md_cite from './scripts/citations.js';
import md_containers from './scripts/containers.js';
import md_math from './scripts/math.js';
import md_metadata from './scripts/metadata.js';
import esbuild from './scripts/esbuild.js';
import html from './scripts/html.js';
import yaml from 'yaml';
import fetch from 'node-fetch';

const src = 
  fs.readdir('src',{ withFileTypes: true })
    .then(dir => 
      Promise.all(dir
        .filter(file => file.isFile && file.name.endsWith('.md'))
        .map(file => fs.readFile('src/' + file.name).then(x => x.toString('utf-8')))
      ).then(files => files.join('\n')
    ))


let bib = fs.readFile('src/bib.yaml').then(f => yaml.parse(f.toString('utf-8')))

const style =
  fs.readFile('src/ieee.csl').then(f => f.toString('utf-8'))

const cites = [];

const meta = {}

const markdown = Promise.all([bib,style]).then(([bib,style]) => md({
    typographer: true,
    html: true  
  })
  .use(md_spans)
  .use(md_attrs)
  .use(md_containers)
  .use(md_math)
  .use(md_figures)
  .use(md_metadata, meta)
  .use(md_cite, bib, style))

const render = Promise.all([src,markdown]).then(([src,md]) => meta.body = md.render(src))

const es = esbuild()
const out = render.then(() => fs.writeFile('build/index.html', html(meta), { encoding: 'utf-8' }))

Promise.all([es,out]).then(() => {  
  prince()  
  .inputs("build/index.html")
  .output("build/index.pdf")
  .execute()
})
