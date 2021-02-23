import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

/** @type { import('markdown-it').PluginSimple } */
export default function (md) {
  const $_pre = (str, beg) => {
    const prv = beg > 0 ? str[beg - 1].charCodeAt(0) : false;
    return !prv || prv !== 0x5c                // no backslash,
      && (prv < 0x30 || prv > 0x39); // no decimal digit .. before opening '$'
  }
  const $_post = (str, end) => {
    const nxt = str[end + 1] && str[end + 1].charCodeAt(0);
    return !nxt || nxt < 0x30 || nxt > 0x39;   // no decimal digit .. after closing '$'
  }
  let rex = /\$((?:\S)|(?:\S.*?\S))\$/gy

  md.inline.ruler.before('escape', 'inline-math', function (state, silent) {
    const pos = state.pos;
    const str = state.src;
    const pre = str.startsWith("$", rex.lastIndex = pos) && ($_pre(str, pos));  // valid pre-condition ...
    const match = pre && rex.exec(str);
    const res = !!match && pos < rex.lastIndex && ($_post(str, rex.lastIndex - 1));

    if (res) {
      if (!silent) {
        const token = state.push('inline-math', 'math', 0);
        token.content = match[1];
        token.markup = '$';
      }
      state.pos = rex.lastIndex;
    }
    return res;
  })

  const adaptor = liteAdaptor()  
  RegisterHTMLHandler(adaptor)

  const tex = new TeX({packages: AllPackages})
  const svg = new SVG({fontCache: 'none'})
  const html = mathjax.document('',{InputJax:tex,OutputJax:svg})  

  md.renderer.rules['inline-math'] = (tokens, idx) => {
    const node = html.convert(tokens[idx].content, {
      display: false,
      em: 15
    })
    return adaptor.outerHTML(node)
  }
}