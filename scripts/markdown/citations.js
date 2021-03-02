import * as citeproc from '@citeproc-rs/wasm';

/** @type { import("markdown-it").PluginSimple }  */
export default function (md) {  
  const rex = /@([\w][\w:.#$%&\-+?<>~\/]*)/    

  function initDriver(md) {
    const { bib, style } = md.options.csl
    const driver = citeproc.Driver.new({
      format: 'html',
      style: style      
    }).unwrap()
    driver.insertReferences(bib)
    return driver
  }

  md.inline.ruler.after('emphasis', 'cite', (state) => {
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
      /** @type { citeproc.Driver } */    
      const driver = state.env.cslDriver = state.env.cslDriver || initDriver(state.md)        
      /** @type { citeproc.ClusterPosition[] } */
      const citations = state.env.citations = state.env.citations || []
      const citations_bib = state.env.citations_bib = state.env.citations_bib || {}

      let id = 'cite-' + (citations.length + 1)

      /** @type { citeproc.Cluster } */
      let cluster = {
        id: id,
        cites: [{ id: match[1] }]
      }
      driver.insertCluster(cluster).unwrap()
      citations.push({id})
      citations_bib[id] = match[1]
      token.meta = id
      
      state.pos = pos;
      state.posMax = max;
      return true;
    }
    return false
  })  

  md.core.ruler.push('bibliography',(state) => {    
    if (!state.inlineMode && !state.tokens.find((tk) => tk.type == 'bibliography'))
      state.tokens.push(new state.Token('bibliography','div'))    
  })  

  function getFullRender(env) {
    /** @type { citeproc.Driver } */
    const driver = env.cslDriver
    driver.setClusterOrder(env.citations).unwrap()
    return driver.fullRender().unwrap()
  }

  md.renderer.rules['cite'] = (tks,idx,opts,env) => {
    /** @type { citeproc.FullRender } */
    const fullRender = env.fullRender || getFullRender(env)    

    const i = tks[idx].meta    

    if (i != undefined) {                  
      return `<a href="#bib:${env.citations_bib[i]}">${fullRender.allClusters[i]}</a>`
    } else {      
      return `[NOT FOUND]`
    }
  }

  md.renderer.rules['bibliography'] = (tks,idx,opts,env) => {      
    /** @type { citeproc.FullRender } */
    const fullRender = env.fullRender || getFullRender(env)
    //const [data,html] = env.csl.makeBibliography();    
    //console.log(data)    
    return fullRender.bibEntries.map(x => `<div class='csl-entry' id='bib:${x.id}'>${x.value}</div>`).join('') // html.map((entry,i) => `<div id='refs:${i}'>${entry}</div>`).join('');
  }
}