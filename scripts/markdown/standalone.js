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
    html.push(
      '  </head>',
      `  <body>${body}</body>`,
      '</html>'
    )
    return(html.join('\n'))
  }
}