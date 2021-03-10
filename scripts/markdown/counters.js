import md_container from 'markdown-it-container';

/** @type { import("markdown-it").PluginSimple } */
export default function (md) {
  const rex = /^\s*(\w+)\s*\*((?:\s+\w+)*)\s*$/
  md_container(md,'counter',{    
    validate: (info) => {
      return rex.test(info)            
    }
  })
  md.core.ruler.after('inline','structure',(state) => {
    let chapter = 0
    let section = 0
    let subsection = 0
    let figure = 0
    let table = 0 
    let containers = { }
    state.tokens.forEach(block => {      
      switch (block.type) {
        case 'heading_open':
          switch (block.tag) {
            case 'h1':
              chapter += 1;
              figure = 0;
              table = 0;
              section = 0;
              subsection = 0;
              containers = {};
              block.attrSet('data-chapter',chapter);
              block.attrSet('data-name', `Chapter ${chapter}`);
              break;
            case 'h2':
              section += 1;
              subsection = 0;
              block.attrSet('data-chapter',chapter);
              block.attrSet('data-section',section);
              block.attrSet('data-name', `Section ${chapter}.${section}`);
              break;
            case 'h3':
              subsection += 1;
              block.attrSet('data-chapter',chapter);
              block.attrSet('data-section',section);
              block.attrSet('data-subsection',subsection);
              block.attrSet('data-name', `Section ${chapter}.${section}.${subsection}`);
              break;
          }
          break;
        case 'fence':
          figure += 1;
          block.attrSet('data-chapter',chapter);
          block.attrSet('data-figure',figure);
          block.attrSet('data-name',`Figure ${chapter}.${figure}`)
          break;
        case 'container_counter_open':
          const match = block.info.match(rex)
          const name = match[1]
          const id = name.toLowerCase()
          const classes = match[2].trim().split(/\s+/)          
          containers[id] = containers[id] || 0
          if (classes.indexOf('continued') < 0)
            containers[id] += 1          
          const i = containers[id]
          block.attrSet('data-chapter',chapter);
          block.attrSet('data-' + id, i);
          block.attrSet('data-name', `${name} ${chapter}.${i}`)
          block.attrJoin('class',id)
          if (classes.length > 0)
            block.attrJoin('class',classes.join(' '));
          break;
        case 'caption_open':          
          table += 1;
          block.attrSet('data-chapter',chapter);
          block.attrSet('data-table',table);
          block.attrSet('data-name',`Table ${chapter}.${table}`)
          break;
        default:        
          if (block.children) {
            block.children.forEach(token => {
              switch (token.type) {
                case 'image':                
                  figure += 1;
                  token.attrSet('data-chapter',chapter);
                  token.attrSet('data-figure', figure);
                  token.attrSet('data-name',`Figure ${chapter}.${figure}`);
                  break;
              }
            })
          }
      }      
    })
  })
}