/** @type { import("markdown-it").PluginSimple } */
export default function (md) {
  md.core.ruler.after('inline','counters',(state) => {
    let chapter = 0
    let section = 0
    let subsection = 0
    let figure = 0    
    state.tokens.forEach(block => {      
      switch (block.type) {
        case 'heading_open':
          switch (block.tag) {
            case 'h1':
              chapter += 1;
              figure = 0;
              section = 0;
              subsection = 0;
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
        default:        
          block.children?.forEach(token => {
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
    })
  })
}