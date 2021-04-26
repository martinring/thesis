/** @type { import("markdown-it").PluginSimple } */
export default function (md) {
  const old = md.render
  md.render = function (src,env) {
    env = env || { meta: {} }    
    const body = old.bind(md,src,env)()    
    const html = ['<!DOCTYPE html>']
    html.push(
      `<html lang="${env.meta.lang || 'en'}">`,
      '  <head>',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '    <meta charset="utf-8">',
      '    <link rel="stylesheet" href="assets/index.css">',
      '    <script src="https://cdnjs.cloudflare.com/ajax/libs/plotly.js/1.33.1/plotly.min.js"></script>',
      '    <script src="assets/index.js"></script>'
    )
    if (env.css)
      html.push(`<style>${env.css}</style>`)
    if (env.meta.title) 
      html.push(`    <title>${env.meta.title}</title>`)
    if (env.meta.author) {
      if (typeof env.meta.author == 'string')
      html.push(`    <meta></meta>`)
    }  
    html.push('  </head>','  <body>')    
    if (env.meta.title) {
      html.push('    <header id="title-block-header">')
      html.push(`      <h1 class="title">${env.meta.title}</h1>`)    
      if(env.meta.subtitle) {
        html.push(`      <p class="subtitle">${md.renderInline(env.meta.subtitle,env)}</p>`)
      }
      if(env.meta.author instanceof Array) {
        env.meta.author.forEach(author => {
          html.push(`      <p class="author">${env.meta.author}</p>`)
        })
      }
      if(env.meta.date) {
        html.push(`      <p class="date">${env.meta.date}</p>`)
      }
      html.push('    </header>')
    }
    html.push('<nav id="TOC" rold="doc-toc">')
    html.push('<h1>Table of Contents</h1>')    
    const mkLevel = (level) => {
      if (level) {
        html.push('<ul>')
        level.forEach(item => {       
          html.push('<li>')        
          html.push(`<a href='#${item.id}'><span class='toc-section-number'>${item.number || ''}</span><span class='title'> ${md.renderer.renderInline(item.content.children,md.options,env)}</a>`)
          mkLevel(item.children)
          html.push('</li>')
        })
        html.push('</ul>')
      }      
      
    }
    mkLevel(env.tree)
    html.push('</nav>')
    /*
    $if(toc)$
    <nav id="$idprefix$TOC" role="doc-toc">
    $if(toc-title)$
    <h2 id="$idprefix$toc-title">$toc-title$</h2>
    $endif$
    $table-of-contents$
    </nav>
    $endif$
    $body$
    $for(include-after)$
    $include-after$
    $endfor$*/
    html.push('<div class="main">',body,'</div>')
    html.push('  </body>','</html>')      
    return(html.join('\n'))
  }
}