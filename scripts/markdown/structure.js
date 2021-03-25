import md_container from 'markdown-it-container';

/** @type { import('markdown-it').PluginSimple } */
export default function (md) {
  const rex = /^\s*(\w+)\s*\*((?:\s+\w+)*)\s*/
  const rex_unnumbered = /\bunnumbered\b/
  const rex_appendix = /\bappendix\b/
  md_container(md,'counter',{    
    validate: (info) => {
      return rex.test(info)            
    }
  })
  md.core.ruler.after('linkify','structure',(state) => {        
    let chapter = 0
    let enumItem
    let enumType = '1'
    let appendix = false
    let section = 0
    let subsection = 0
    let subsubsection = 0
    let figure = 0
    let table = 0 
    let tableBlock = null
    let containers = { }
    state.tokens.forEach(block => {          
      if (rex_unnumbered.test(block.attrGet('class'))) {
        // nothing?
      } else {
        switch (block.type) {
          case 'heading_open':          
            switch (block.tag) {
              case 'h1':
                if (!appendix && rex_appendix.test(block.attrGet('class'))) {
                  chapter = 0
                  appendix = true                  
                }
                chapter += 1;
                const chapterSym = appendix ? String.fromCharCode('A'.charCodeAt(0) - 1 + chapter) : chapter.toString()
                figure = 0;
                table = 0;
                section = 0;              
                subsection = 0;
                subsubsection = 0;
                containers = {};                
                block.attrSet('data-chapter', chapterSym);
                block.attrSet('data-name', `${appendix ? 'Appendix' : 'Chapter'} ${chapterSym}`);
                break;
              case 'h2':
                section += 1;
                subsection = 0;
                subsubsection = 0;
                block.attrSet('data-chapter',chapter);
                block.attrSet('data-section',section);
                block.attrSet('data-name', `Section ${chapter}.${section}`);
                break;
              case 'h3':
                subsection += 1;
                subsubsection = 0;
                block.attrSet('data-chapter',chapter);
                block.attrSet('data-section',section);
                block.attrSet('data-subsection',subsection);
                block.attrSet('data-name', `Section ${chapter}.${section}.${subsection}`);
                break;
              case 'h4':
                subsubsection += 1;              
                const letter = String.fromCharCode('A'.charCodeAt(0) - 1 + subsubsection);
                block.attrSet('data-chapter',chapter);
                block.attrSet('data-section',section);
                block.attrSet('data-subsection',subsection);
                block.attrSet('data-subsubsection',letter);
                block.attrSet('data-name', `Section ${chapter}.${section}.${subsection} Paragraph ${letter}`);
            }
            break;
          case 'fence':
            if (block.attrGet('caption')) {
              figure += 1;
              block.attrSet('data-chapter',chapter);
              block.attrSet('data-figure',figure);
              block.attrSet('data-name',`Figure ${chapter}.${figure}`)
            }
            break;
          case 'display-math':
            block.attrSet('data-chapter',chapter);
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
          case 'table_open':
            table += 1;
            tableBlock = block
            block.attrSet('data-chapter',chapter);
            block.attrSet('data-table',table);
            block.attrSet('data-name',`Table ${chapter}.${table}`)
          case 'caption_open':                        
            if (tableBlock && block.attrs) {              
              block.attrs.forEach(([k,v]) => tableBlock.attrJoin(k,v))
              block.attrs = null
            }
            block.attrSet('data-chapter',chapter);
            block.attrSet('data-table',table);
            block.attrSet('data-name',`Table ${chapter}.${table}`)
            break;
          case 'ordered_list_open':
            enumItem = 0
            enumType = block.attrGet('type') || '1'
            break;
          case 'ordered_list_close':
            enumItem = undefined
            break;
          case 'list_item_open':            
            if (typeof enumItem != 'undefined') {
              enumItem += 1
              block.attrSet('data-item',enumItem)
              switch (enumType) {
                case '1':
                  block.attrSet('data-name',`(${enumItem})`)
                  break;
                case 'a':
                  block.attrSet('data-name',`(${String.fromCharCode('a'.charCodeAt(0) - 1 + enumItem)})`)
                  break;
                case 'A':
                  block.attrSet('data-name',`(${String.fromCharCode('A'.charCodeAt(0) - 1 + enumItem)})`)
                  break;
                default:
                  break;
              }              
            }
            break;
          default:                    
            if (block.children) {
              let i = 0
              while (i < block.children.length) {
                const token = block.children[i]
                switch (token.type) {
                  case 'image':
                    // implicit figures
                    if (block.children.length == 1) {
                      figure += 1;
                      const open = new state.Token('figure_open','figure',1)
                      open.attrSet('data-chapter',chapter);
                      open.attrSet('data-figure', figure);
                      open.attrSet('data-name',`Figure ${chapter}.${figure}`);
                      const subfigures = new state.Token('subfigures_open','div',1)
                      subfigures.attrSet('class','subfigures')
                      const tokens = [open,subfigures]                      
                      const images = token.attrGet('src')?.split(';') || []
                      token.attrs.forEach(([k,v]) => {
                        if (k == 'width') {
                          subfigures.attrJoin('style',`width: ${v};`)
                        } else if (k == 'height') {
                          subfigures.attrJoin('style',`height: ${v};`)
                        } else if (k != 'src' && k != 'alt') {
                          open.attrSet(k,v)
                        }
                      })
                      images.forEach(src => {
                        const image = new state.Token('image','img')
                        image.attrSet('src',src)
                        image.attrSet('alt',src)
                        image.children = token.children
                        tokens.push(image)
                      })
                      tokens.push(new state.Token('subfigures_close','div',-1))
                      const caption = new state.Token('figcaption_open','figcaption',1);
                      caption.attrSet('data-chapter',chapter);
                      caption.attrSet('data-figure', figure);
                      caption.attrSet('data-name',`Figure ${chapter}.${figure}`);
                      tokens.push(caption);
                      tokens.push(...token.children);
                      tokens.push(new state.Token('figcaption_close','figcaption',-1))
                      tokens.push(new state.Token('figure_close','figure',-1))
                      block.children.splice(i,1,...tokens);
                      i += tokens.length;
                      break;
                    }                    
                  default:
                    i += 1;                    
                }                
              }
            }
        }      
      }
    })
  })
}