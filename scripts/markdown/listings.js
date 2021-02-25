/** @type { import("markdown-it").PluginSimple } */
export default function (md) {
  md.renderer.rules.fence = (tokens,idx,options,env,self) => {
    const token = tokens[idx]
    console.log(token.attrs)        
    const caption = token.attrGet('caption')
    return `<figure ${self.renderAttrs(token)}><pre><code>${token.content}</code></pre>${caption ? '<figcaption>' + caption + '</figcaption>' : ''}</figure>`
  }
}