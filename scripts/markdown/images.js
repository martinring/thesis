import fs from 'fs';
import path from 'path';
import * as log from '../log.js'
import esbuild from 'esbuild';

/** @type { import("markdown-it").PluginSimple } */
export default function (md) {
  let defaultRule = md.renderer.rules['image']
  md.renderer.rules['image'] = function (tokens, idx, opts, env, slf) {
    const token = tokens[idx];
    if (token.attrGet('data-figure') != undefined) {    
      let ext
      let src = token.attrGet('src')    
      if (src && fs.existsSync('src/figures/' + src)) {              
          ext = path.parse(src).ext.slice(1)
          if (ext != 'js' && ext != 'ts') {
            const mime = 'image/' + ext
            fs.mkdirSync('build/figures',{ recursive: true })          
            fs.copyFileSync('src/figures/' + src, 'build/figures/' + src)               
            const uri = 'figures/' + src
            token.attrSet('src', uri)     
          } else {
          }
      } else {
          log.warn(`'src/figures/${src}' does not exist`)
      }
      const name = token.attrGet('data-name')
      let figattrs = ''    
      token.attrs.forEach(([k,v],i,attrs) => {
        if (k == 'id' || k == 'class' || k=='width' || k.startsWith('data-')) {          
          figattrs += ` ${k == 'width' ? 'data-width' : k}="${v}"`
          attrs[i] = undefined
        }
      })
      token.attrs = token.attrs.filter(x => x !== undefined)
      let img
      switch (ext) {
        case 'svg':
          img = `<object type="image/svg+xml" data="${token.attrGet('src')}"></object>`
          break;
        case 'js':
        case 'ts':
          env.id = ((env.id) || 0) + 1
          const build = esbuild.buildSync({
            stdin: {
              resolveDir: 'src/figures',
              sourcefile: "fig-" + src,
              contents: `import render from './${src}'
render(document.getElementById('script-img-${env.id}'))`
            },
            bundle: true,
            //entryPoints: ['src/figures/' + src],
            outdir: 'build/figures/',            
            write: false              
          })
          build.warnings.forEach(msg => {
            log.warn(msg.location + ": " + msg.text)
          })               
          const file = build.outputFiles[0]
          token.attrSet('src',path.relative('./build',file.path))          
          img = `<div class='image' id='script-img-${env.id}'></div><script type='module'>` +
          new TextDecoder().decode(file.contents) + 
          `</script>`
          break;
        default:
          img = slf.renderToken(tokens,idx,opts)
          break;
      } 
      return `<figure${figattrs}>${img}<figcaption><span class='name'>${name}</span>${slf.renderInline(token?.children || [],opts,env)}</figcaption></figure>`
    } else return defaultRule(tokens,idx,opts,env,slf)
  }
}