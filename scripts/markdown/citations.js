import * as citeproc from '@citeproc-rs/wasm';
import citations from 'markdown-it-citations';

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
          driver.setClusterOrder(citations).unwrap()
          return id
        },
        renderCluster(id,renderer) {
          if (!fullRender) {
            driver.setClusterOrder(citations)
            fullRender = driver.fullRender().unwrap()
          }          
          return fullRender.allClusters[id]
        },
        renderBibliography() {
          if (fullRender)
            return fullRender.bibEntries.map(x => `<div class='csl-entry' id='bib:${x.id}'>${x.value}</div>`).join('')
          else return ''
        }
      }
    }
  })
}