#!/usr/bin/env node
// @ts-check
import markdown from 'markdown-it';
import md_include from 'markdown-it-include';
import md_headersecs from 'markdown-it-header-sections';
import md_spans from 'markdown-it-bracketed-spans';
import md_texmath from 'markdown-it-texmath';
import md_mathjax from 'markdown-it-mathjax-svg-next';
import md_container from 'markdown-it-container';
import md_attrs from 'markdown-it-attrs';
import katex from 'katex';
import prince from 'prince';
import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';
import citation from 'citation-js';

const src = fs.readFileSync('src/index.md').toString('utf-8')
const bib_src = fs.readFileSync('src/references.bib').toString('utf-8');

const bib = citation.input(bib_src);

// Markdown Configuration
const md = markdown({
  typographer: true,
  html: true  
})
  .use(md_include, {
    root: 'src',
    includeRe: /@include(.+)/,
    bracesAreOptional: true
  })
  .use(md_headersecs)
  .use(md_spans)
  .use(md_attrs)
  .use(md_texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: {
      output: 'mathml'
    }  
  })
  .use(md_container,'figure')
  .use(md_container,'example')
  .use(md_mathjax)

md.renderer.rules.image = function (tokens, idx, opts, env, slf) {
  const token = tokens[idx];            
  let src = token.attrGet('src')
  if (src && fs.existsSync('src/figures/' + src)) {
      const mime = 'image/' + path.parse(src).ext.slice(1)
      fs.mkdirSync('build/figures',{ recursive: true })
      fs.copyFileSync('src/figures/' + src, 'build/figures/' + src)
      const uri = 'figures/' + src
      token.attrSet('src', uri)                
  } else {
      console.warn(`'src/figures/${src}' does not exist`)
  }
  return `<figure>${slf.renderToken(tokens,idx,opts)}<figcaption>${slf.renderInline(token?.children || [],opts,env)}</figcaption></figure>`
}


let cites = []

function cite(ref) {
  const idx = cites.indexOf(ref)
  if (idx >= 0) {
    return idx + 1;
  } else {
    return cites.push(ref);
  }
}

md.core.ruler.after('inline', 'cite', (state) => {
  const regex = /\[\s*@([^\s]+)\s*\]/g
  const max = state.tokens.forEach(block => {
    block.children?.forEach((inline, i) => {
      if (inline.type === 'text') {                
        let cur = 0
        let level = inline.level
        let nodes = []        
        for (const match of inline.content.matchAll(regex)) {          
          if (match.index > cur) {
            const before = new state.Token('text', '', 0);
            before.content = inline.content.slice(cur, match.index)
            before.level = level
            nodes.push(before)
          }

          const open = new state.Token('link_open', 'a', 1);
          open.attrs = [['href', '']];
          open.level = level++;

          const text = new state.Token('text', '', 0);
          text.content = `[${cite(match[1])}]`;

          const close = new state.Token('link_close', 'a', -1);
          close.level = --level;

          nodes.push(open, text, close)
          cur = match.index + match[0].length
        }
        if (cur == 0) {
          return
        } else if (cur < inline.content.length) {
          const after = new state.Token('text','',0)
          after.content = inline.content.slice(cur);
          after.level = level;
          nodes.push(after)
        }
        block.children.splice(i,1,...nodes);
      }
    })
  })
  return true
})



/*
md.core.ruler.before('normalize','include', (state) => {  
  return false
})*/

/*md.core.ruler.before('normalize','include', (state) => {
  state.
})*/

const env = {}

const tkns = md.parse(src, env)

const body = md.renderer.render(tkns, md.options, env)

// Javascript / CSS build
await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "build/assets",
  platform: "browser",
  format: "esm",
  sourcemap: true,
  loader: {
    ".woff": "file",
    ".woff2": "file",
    ".ttf": "file"    
  }
})

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Self-Verifying Systems</title>
    <link rel="stylesheet" href="assets/index.css">
    <script src="assets/index.js"></script>
  </head>
  <body>${body}</body>
</html>`

fs.writeFileSync('build/index.html', html, { encoding: 'utf-8' })

// PDF Build
await prince()
  .inputs("build/index.html")
  .output("build/index.pdf")
  .execute()