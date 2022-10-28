#!/usr/bin/env node
import prince from 'prince';
import fs from 'fs/promises';
import md from './markdown.js';
import esbuild from './esbuild.js';
import * as log from './log.js';
import puppeteer from 'puppeteer-core';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { argv } from 'process';
import Cite from 'citation-js';
import yaml from 'yaml';

const options = yargs(hideBin(argv))
  .option('pdf',{ boolean: true })
  .option('file',{ type: "string" })
  .argv

const t0 = Date.now()

await fs.mkdir("build", { recursive: true })

const src_ = log.timed('load markdown sources', 
  options.file ? fs.readFile(options.file).then(x => x.toString('utf-8')) :
  fs.readdir('src',{ withFileTypes: true })
    .then(dir => 
      Promise.all(dir
        .filter(file => file.isFile && file.name.endsWith('.md'))
        .map(file => fs.readFile('src/' + file.name).then(x => x.toString('utf-8')))
      ).then(files => files.join('\n\n')
    ))
)

const bib_ = log.timed('load bibliography',
  fs.readdir('src/bib',{ withFileTypes: true} )
    .then(dir => 
      Promise.all([...dir.filter(file => file.isFile && file.name.endsWith('.yaml'))
           .map(file => fs.readFile('src/bib/' + file.name).then(x => yaml.parse(x.toString('utf-8')))),
         ...dir.filter(file => file.isFile && file.name.endsWith('.json'))
           .map(file => fs.readFile('src/bib/' + file.name).then(x => JSON.parse(x.toString('utf-8')))),
         ...dir.filter(file => file.isFile && file.name.endsWith('.bib'))
           .map(file => fs.readFile('src/bib/' + file.name).then(x => Cite.input(x.toString('utf-8'))))]
        ).then(arrs => {    
    const result = new Map() 
    arrs.forEach(x => x.forEach(item => {
      if (!item.id) {
        log.warn(`no id for reference '${item.title}'`)
      } else {
        if (result.has(item.id)) {
          log.warn(`duplicate bib entry '${item.id}'`)          
        } else {
          delete item._graph          
          result.set(item.id,item)
        }
      }
    }))    
    const arr = Array.from(result.values())
    fs.writeFile('build/bib.yaml', yaml.stringify(arr,{    
    }))
    return arr
  })
))

const style_ = log.timed('load citation style',
  fs.readFile('src/bib/ieee.csl').then(f => f.toString('utf-8'))
)

const cssOut = [];

const [bib,style] = await Promise.all([bib_,style_])

const markdown_ = log.timed('initialize markdown engine',md({
    typographer: true,
    html: true,
    checkRefs: true,
    csl: {
      bib,
      style
    },
    cssOut
  }))

const [src,markdown] = await Promise.all([src_,markdown_])

const html_ = log.timed('building markdown',() => markdown.render(src))
const es = log.timed('building javascript and css', esbuild())

const html = await html_

await log.timed('write html output',fs.writeFile('build/index.html', html, { encoding: 'utf-8' }))
await es

if (options.pdf) {  
  const browser = await log.timed('launch chromium',puppeteer.launch({channel: 'chrome'}));  
  const page = await log.timed('chromium: new page', browser.newPage())
  await page.setViewport({ height: 500, width: 800 })
  await page.setUserAgent('PDF')
  const htmlpath = await fs.realpath('build/index.html')
  await log.timed('chromium: open ' + htmlpath, page.goto('file://' + htmlpath))
  const shot = await log.timed('chromium: retrieve content', page.content())
    
  fs.writeFile('build/index.prince.html',shot)
  await page.close()
  await browser.close()
  
  await log.timed('building pdf', prince()
      .inputs('build/index.prince.html')
      .output("build/index.pdf")
      .execute())
}

log.info(`total time ${Date.now() - t0}ms`)
process.exit(0)