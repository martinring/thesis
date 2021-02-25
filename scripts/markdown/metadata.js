import yaml from 'yaml';

const openRe = /^-{3}\s*$/
const closeRe = /^\.{3}\s*$/
const emptyRe = /^\s*$/

/** @type { import("markdown-it").PluginSimple } */
export default function (md,meta = {}) {
  md.core.ruler.after('normalize','metadata',(state) => {
    if (state.inlineMode) {
      return false
    } else {
      let src = []
      let buf = []
      let lines = state.src.split('\n')      
      let metadataBlockAllowed = true
      lines.forEach((line,i) => {  
        if (metadataBlockAllowed && openRe.test(line)) {               
          buf.push(line)
        } else if (buf.length > 0) {
          if (closeRe.test(line)) {            
            buf.push(line)
            try {
              Object.assign(meta,yaml.parse(buf.join('\n')))              
            } catch (e) {
              console.warn(e)
              lines.push(...buf)
            }    
            buf = []
          } else {
            buf.push(line)
          }
        } else {
          src.push(line)          
          metadataBlockAllowed = emptyRe.test(line)          
        }
      })
      src.push(...buf)
      state.src = src.join('\n')      
    }
  })
}