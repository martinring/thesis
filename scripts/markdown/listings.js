import Highlights from 'highlights'
import url from 'url';
import path from 'path'

const highlighter = new Highlights({
  includePath: path.dirname(path.dirname(path.dirname(url.fileURLToPath(import.meta.url)))) + '/highlights'
})
highlighter.loadGrammarsSync()

const scopeNames = {
  "haskell": 'source.haskell',
  "smt-lib": 'source.smtlib',
  "ocl": 'source.ocl',
  "dimacs": "source.dimacs"
}

/** @type { import("markdown-it").PluginSimple } */
export default function (md) {  
  //md.core.ruler.after('block','fence-captions')

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {    
    const token = tokens[idx]    
    if (token.content.slice(-1) == '\n') token.content = token.content.slice(0,-1)
    let lang = token.info.split(/\s+/)[0]
    if (lang == '') lang = token.attrGet('class')?.split(/\s+/)?.[0]
    token.attrJoin('class', 'listing')
    const caption = token.attrGet('caption')
    const codeBlock = highlighter.highlightSync({
      fileContents: token.content,
      scopeName: scopeNames[lang] || 'source.' + lang
    })    
    if (caption) {
      const name = token.attrGet('data-name')
      return `<figure ${self.renderAttrs(token)}>${codeBlock}<figcaption data-name="${name}">${md.renderInline(caption, env)}</figcaption></figure>`
    } else {
      return `<code ${self.renderAttrs(token)}>${codeBlock}</code>`
    }
  }
}