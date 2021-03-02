import yaml from 'yaml';

const openRe = /^-{3}\s*$/
const closeRe = /^\.{3}\s*$/
const emptyRe = /^\s*$/

/** 
 * @param { any } env
 * @param { (string|number)[] } path }
 * @returns { any }
 */
export function getMetaObject(env,...path) {
  let res = env.meta || (env.meta = {})
  path.forEach(x => {
    if (typeof res != 'object') {
      console.error(`failed to access object meta.${path.join('.')}: path contains non-object values`)
    }
    res[x] = res[x] || (res[x] = {})
  })
  return res
} 

/** @type { import("markdown-it").PluginSimple } */
export default function (md) {  
  md.core.ruler.after('normalize','metadata',(state) => {
    const meta = state.env.meta || (state.env.meta = {})
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
              const val = yaml.parse(buf.join('\n'))
              if (typeof val == 'object')              
                Object.assign(meta,yaml.parse(buf.join('\n')))              
              else
                lines.push(...buf)
            } catch (e) {
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