/** @type { import("markdown-it").PluginSimple } */
export default function (md) {
  const old = md.renderer.render
  md.renderer.render = function (tokens,options,env) {  
    const body = old.bind(md.renderer,tokens,options,env)()  
    const meta = env.meta || {}
    const html = ['<!DOCTYPE html>']
    html.push(
      `<html lang="${meta.lang || 'en'}">`,
      '  <head>',
      '    <meta charset="utf-8">',
      '    <link rel="stylesheet" href="assets/index.css">',
      '    <script src="assets/index.js"></script>'
    )
    if (env.css)
      html.push(`<style>${env.css}</style>`)
    if (meta.title) 
      html.push(`    <title>${meta.title}</title>`)
    if (meta.author) {
      if (typeof meta.author == 'string')
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