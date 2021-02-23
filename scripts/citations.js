import CSL from 'citeproc';
import request from 'sync-request';

/** @type { import("markdown-it").PluginSimple }  */
export default function (md, bib, style) {  
  const rex = /@([\w][\w:.#$%&\-+?<>~\/]*)/

  md.inline.ruler.after('emphasis', 'cite', (state) => {
    let csl = state.env.csl = state.env.csl || new CSL.Engine({
      retrieveLocale(lang) {            
        return request('GET', `https://raw.githubusercontent.com/citation-style-language/locales/master/locales-${lang}.xml`).getBody().toString('utf-8');
      },
      retrieveItem(id) {
        return bib.find(i => i.id == id)
      }
    },style)
    let citations = state.env.citations = state.env.citations || []
    let citationsPre = state.env.citationsPre = state.env.citationsPre || []
    let citationTargets = state.env.citationTargets = state.env.citationTargets || []

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
      
      const token = state.push('cite', 'cite')      
      if (bib.find(x => x.id == match[1])) {
        let i = citationsPre.length
        const [{bibchange,citation_errors},changes] = csl.processCitationCluster({
          citationItems: [{ id: match[1] }],
          properties: { noteIndex: 0 }
        },citationsPre,[])
        changes.forEach(([j,s,id]) => {
          citations[j] = s
          if (j == i) citationsPre.push([id,0])
        })
        token.meta = i
      }      
      
      state.pos = pos;
      state.posMax = max;
      return true;
    }
    return false
  })

  md.core.ruler.push('bibliography',(state) => {    
    if (!state.tokens.find((tk) => tk.type == 'bibliography'))
      state.tokens.push(new state.Token('bibliography','div'))    
  })

  md.renderer.rules['cite'] = (tks,idx,opts,env) => {
    const i = tks[idx].meta
    if (i != undefined) {                  
      return `<a href='#refs:${i}'>${env.citations[i]}</a>`      
    } else {      
      return `[NOT FOUND]`
    }    
  }

  md.renderer.rules['bibliography'] = (tks,idx,opts,env) => {      
    const [data,html] = env.csl.makeBibliography();    
    //console.log(data)
    let src = data.bibstart
    return html.map((entry,i) => `<div id='refs:${i}'>${entry}</div>`).join('');
  }
}