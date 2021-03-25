#!/usr/bin/env node
// @ts-check
import prince from 'prince';
import fs from 'fs/promises';
import path from 'path';
import md from './scripts/markdown.js';
import esbuild from './scripts/esbuild.js';
import yaml from 'yaml';
import * as log from './scripts/log.js';
import puppeteer from 'puppeteer-core';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { argv } from 'process';
import { fileURLToPath } from 'url';

const options = yargs(hideBin(argv))
  .option('pdf',{ boolean: true })
  .argv

const t0 = Date.now()

const src_ = log.timed('load markdown sources',
  fs.readdir('src',{ withFileTypes: true })
    .then(dir => 
      Promise.all(dir
        .filter(file => file.isFile && file.name.endsWith('.md'))
        .map(file => fs.readFile('src/' + file.name).then(x => x.toString('utf-8')))
      ).then(files => files.join('\n\n')
    ))
)

const bib_ = log.timed('load bibliography',
  fs.readFile('src/bib/bib.yaml').then(f => yaml.parse(f.toString('utf-8')))
)

const style_ = log.timed('load citation style',
  fs.readFile('src/bib/ieee.csl').then(f => f.toString('utf-8'))
)

const cites = [];

const cssOut = [];

const [bib,style] = await Promise.all([bib_,style_])

const markdown_ = log.timed('initialize markdown engine',md({
    typographer: true,
    html: true,
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
  const browser = await log.timed('launch chromium',puppeteer.launch({
    executablePath: '/opt/homebrew/bin/chromium'    
  }));  
  const page = await log.timed('chromium: new page', browser.newPage())
  await page.setViewport({ height: 500, width: 745 })
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