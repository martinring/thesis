import fs from 'fs';
import path from 'path';

/** @type { import("markdown-it").PluginSimple } */
export default function (md) {
  let defaultRule = md.renderer.rules['image']
  md.renderer.rules['image'] = function (tokens, idx, opts, env, slf) {    
    const token = tokens[idx];
    if (token.attrGet('data-figure') != undefined) {    
      let svg = false         
      let src = token.attrGet('src')    
      if (src && fs.existsSync('src/figures/' + src)) {              
          const ext = path.parse(src).ext.slice(1)       
          svg = ext == 'svg' 
          const mime = 'image/' + ext
          fs.mkdirSync('build/figures',{ recursive: true })
          fs.copyFileSync('src/figures/' + src, 'build/figures/' + src)
          const uri = 'figures/' + src
          token.attrSet('src', uri) 
          /*}*/
      } else {
          console.warn(`'src/figures/${src}' does not exist`)
      }
      const name = token.attrGet('data-name')
      let figattrs = ''    
      token.attrs.forEach(([k,v],i,attrs) => {
        if (k == 'id' || k == 'class' || k.startsWith('data-')) {
          figattrs += ` ${k}="${v}"`
          attrs[i] = undefined
        }
      })
      token.attrs = token.attrs.filter(x => x !== undefined)
      const imgObject = svg ? 
        `<object type="image/svg+xml" data="${token.attrGet('src')}"></object>` : 
        slf.renderToken(tokens,idx,opts)
      return `<figure${figattrs}>${imgObject}<figcaption><span class='name'>${name}</span>${slf.renderInline(token?.children || [],opts,env)}</figcaption></figure>`
    } else return defaultRule(tokens,idx,opts,env,slf)
  }
}