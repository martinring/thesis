import fs from 'fs';
import path from 'path';

/** @type { import("markdown-it").PluginSimple } */
export default function (md) {  
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
}