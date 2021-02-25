import fs from 'fs';
import path from 'path';
import xml from 'xml2js';

/** @type { import("markdown-it").PluginSimple } */
export default function (md) {  
  md.renderer.rules['image'] = function (tokens, idx, opts, env, slf) {
    const token = tokens[idx];            
    let src = token.attrGet('src')    
    if (src && fs.existsSync('src/figures/' + src)) {        
        const ext = path.parse(src).ext.slice(1)
        /*if (ext == 'svg') {
          const svg = fs.readFileSync('src/figures/' + src).toString('utf-8')
          xml.parseString(svg)
          return svg
        } else {*/
          const mime = 'image/' + ext
          fs.mkdirSync('build/figures',{ recursive: true })
          fs.copyFileSync('src/figures/' + src, 'build/figures/' + src)
          const uri = 'figures/' + src
          token.attrSet('src', uri) 
        /*}*/
    } else {
        console.warn(`'src/figures/${src}' does not exist`)
    }
    let figattrs = ''    
    token.attrs.forEach(([k,v],i,attrs) => {
      if (k == 'id' || k == 'class' || k.startsWith('data-')) {
        figattrs += ` ${k}="${v}"`
        attrs[i] = undefined
      }
    })
    token.attrs = token.attrs.filter(x => x !== undefined)
    return `<figure${figattrs}>${slf.renderToken(tokens,idx,opts)}<figcaption>${slf.renderInline(token?.children || [],opts,env)}</figcaption></figure>`
  }
}