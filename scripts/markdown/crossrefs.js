/** @type { import("markdown-it").PluginSimple } */
export default function (md) {
  const rex = /#([\w][\w:.#$%&\-+?<>~\/]*)/

  md.inline.ruler.after('emphasis', 'crossref', (state) => {
    var max = state.posMax

    if (state.src.charCodeAt(state.pos) !== 0x5B) {
      // opening [
      return false;
    }

    var labelStart = state.pos + 1;
    var labelEnd   = state.md.helpers.parseLinkLabel(state, state.pos, true);

    if (labelEnd < 0) {
      return false;
    }

    var pos = labelEnd + 1;  
    const match = state.src.slice(labelStart,labelEnd).match(rex)  

    if (match && state.src.charCodeAt(pos + 1) != 0x28 /* ( */) {
      state.pos = labelStart;
      state.posMax = labelEnd;            
      
      const token = state.push('crossref', 'a', 1)
      token.attrSet('href',match[0])
      state.push('crossref','a',-1)
          
      state.pos = pos;
      state.posMax = max;
      return true;
    }
    return false
  })
  
  md.core.ruler.push('crossrefs',(state) => {
    state.env.refs = state.env.refs || {}
    state.tokens.forEach(t => {      
      let id
      if (id = t.attrGet('id')) {
        state.env.refs[id] = t.attrGet('data-name')        
      }
      t.children?.forEach(t => {
        let id
        if (id = t.attrGet('id')) {
          state.env.refs[id] = t.attrGet('data-name')
        }
      })
    })    
  })

  md.renderer.rules['crossref'] = (tks,idx,opts,env,self) => {
    const token = tks[idx]
    if (token.nesting == 1) {
      const name = env.refs[token.attrGet('href').slice(1)] || 'UNDEFINED CROSSREF'
      return `<a ${self.renderAttrs(token)}>${name}`
    } else {
      return '</a>'
    }
  }
}