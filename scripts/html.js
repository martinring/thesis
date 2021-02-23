/** @param {string} body */
export default function html(meta) {  
  const html = ['<!DOCTYPE html>']
  html.push(
    `<html lang="${meta.lang || 'en'}">`,
    '  <head>',
    '    <meta charset="utf-8">',
    '    <link rel="stylesheet" href="assets/index.css">',
    '    <script src="assets/index.js"></script>'
  )
  if (meta.title) 
    html.push(`    <title>${meta.title}</title>`)
  if (meta.author) {
    if (typeof meta.author == 'string')
    html.push(`    <meta></meta>`)
  }  
  html.push(
    '  </head>',
    `  <body>${meta.body}</body>`,
    '</html>'
  )
  return(html.join('\n'))
}