import container from 'markdown-it-container'

const rex = /^\s*(\w+|\{(([.#]\w+|\w+\s*\=\s*("[^"]*"|'[^']'|\w+))\s*)*\})\s*$/

/** @type { import("markdown-it").PluginSimple } */
export default function (md) {
  container(md,'generic',{
    validate(params) { return rex.test(params) }
  })
}