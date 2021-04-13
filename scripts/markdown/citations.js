import * as citeproc from '@citeproc-rs/wasm';
import citations from 'markdown-it-citations';
import * as log from '../log.js'

/** @type { import("markdown-it").PluginSimple }  */
export default function (md) {  
  citations(md,{
    citeproc: (env) => {
      const { bib, style } = md.options.csl      
      /** @type { citeproc.Driver } */
      const driver = citeproc.Driver.new({
        format: 'html',
        style: style
      }).unwrap()            
      driver.insertReferences(bib)                
      let counter = 1      
      /** @type { citeproc.ClusterPosition[] } */
      let citations = []
      let fullRender
      return {
        appendCluster(cluster) {
          if (md.options.checkRefs) {
            cluster.forEach(cite => {
              if (!bib.find(x => x.id == cite.citationId)) {
                log.warn('undefined reference: ' + cite.citationId)
              }
            })
          }
          const id = 'cite-' + (counter++)                   
          citations.push({
            id
          })
          driver.insertCluster({
            id,
            cites: cluster.map(citation => ({              
              id: citation.citationId
            }))            
          }).unwrap()
          return id
        },
        renderCluster(id,renderer) {
          if (!fullRender) {
            driver.setClusterOrder(citations).unwrap()
            fullRender = driver.fullRender().unwrap()            
          }
          return `<a href='#refs'>${fullRender.allClusters[id]}</a>`
        },
        renderBibliography() {
          if (!fullRender) {
            driver.setClusterOrder(citations).unwrap()
            driver.makeBibliography().unwrap()
            fullRender = driver.fullRender().unwrap()
          }
          return fullRender.bibEntries.map(x => `<div class='csl-entry' id='bib:${x.id}'>${x.value}</div>`).join('')          
        }
      }
    }
  })
}