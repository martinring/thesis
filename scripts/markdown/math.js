import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { CHTML } from 'mathjax-full/js/output/chtml.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AssistiveMmlHandler } from 'mathjax-full/js/a11y/assistive-mml.js';
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

  const block_rex = /\${2}([^$]+?)\${2}/gmy
  
  md.block.ruler.before('fence','display-math', function block(state, begLine, endLine, silent) {
    const pos = state.bMarks[begLine] + state.tShift[begLine];
    const str = state.src;
    const pre = str.startsWith('$$', block_rex.lastIndex = pos)
    const match = pre && block_rex.exec(str);
    const res = !!match
      && pos < block_rex.lastIndex 

    if (res && !silent) {    // match and valid post-condition ...
        const endpos = block_rex.lastIndex - 1;
        let curline;

        for (curline = begLine; curline < endLine; curline++)
            if (endpos >= state.bMarks[curline] + state.tShift[curline] && endpos <= state.eMarks[curline]) // line for end of block math found ...
                break;

        // "this will prevent lazy continuations from ever going past our end marker"
        // s. https://github.com/markdown-it/markdown-it-container/blob/master/index.js
        const lineMax = state.lineMax;
        const parentType = state.parentType;
        state.lineMax = curline;
        state.parentType = 'math';

        if (parentType === 'blockquote') // remove all leading '>' inside multiline formula
            match[1] = match[1].replace(/(\n*?^(?:\s*>)+)/gm,'');
        // begin token
        let token = state.push('display-math', 'math', 0);  // 'math_block'
        token.block = true;
        token.markup = "$$";
        token.content = match[1];
        token.info = match[match.length-1];    // eq.no
        token.map = [ begLine, curline ];
        state.parentType = parentType;
        state.lineMax = lineMax;
        state.line = curline+1;
    }
    return res;
  })

  const inline_rex = /\$((?:\S)|(?:\S.*?\S))\$([,.)])?/gy

  md.inline.ruler.before('escape', 'inline-math', function (state, silent) {
    const pos = state.pos;
    const str = state.src;
    const pre = str.startsWith("$", inline_rex.lastIndex = pos) && ($_pre(str, pos));  // valid pre-condition ...
    const match = pre && inline_rex.exec(str);
    const res = !!match && pos < inline_rex.lastIndex && ($_post(str, inline_rex.lastIndex - 1));

    if (res) {
      if (!silent) {
        if (match[2]) {
          state.push('nobr_open','span',1).attrSet('class','nobr')
        }
        const token = state.push('inline-math', 'math', 0);        
        token.meta = match[1]; // TODO: this is hacky. when using content this conflicts with markdown-it-atts if content ends with curlies
        token.markup = '$';
        if (match[2]) {
          state.pending = match[2]
          state.push('nobr_close','span',-1).attrSet('class','nobr')
        }
      }
      state.pos = inline_rex.lastIndex;
    }
    return res;
  })

  let equation = 0;

  function getMathEngine(env,chapter) {
    if (env.chapter != (env.chapter = chapter)) equation = 0;
    if (env.mathjax) return env.mathjax
    const adaptor = liteAdaptor({
      fontFamily: 'Vollkorn'
    })  
    const handler = RegisterHTMLHandler(adaptor)     
    AssistiveMmlHandler(handler)

    const tex = new TeX({
      packages: AllPackages, 
      tags: 'ams',
      macros: env.meta?.macros || {},
      tagformat: {
        number: () => env.chapter + '.' + (++equation),
        id: (n) => n
      }
    })
  
    const chtml = new CHTML({
      fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2',
      mtextInheritFont: true
    })
  
    const html = mathjax.document('',{
      InputJax:tex,
      OutputJax:chtml
    })
  
    tex.postFilters.add((x) => {
      Object.values(x.data.tags.allLabels).forEach(x => {      
        (env.refs || (env.refs = {}))[x.id] = "Equation " + x.tag
      })
    })
    
    return {
      html, adaptor, chtml
    }
  }

  md.core.ruler.push('display-math',(state) => {
    state.tokens.forEach(token => {
      if (token.type == 'display-math') {         
        const math = getMathEngine(state.env,token.attrGet('data-chapter'))        
        const node = math.html.convert(token.content, {
          display: true,
          em: 16
        })
        state.env.css = math.adaptor.textContent(math.chtml.styleSheet(math.html))
        token.content = math.adaptor.outerHTML(node)
      }
    })
  })

  md.renderer.rules['inline-math'] = (tokens, idx, opts, env) => {    
    const math = getMathEngine(env)
    const node = math.html.convert(tokens[idx].meta, {
      display: false,
      em: 16
    })
    env.css = math.adaptor.textContent(math.chtml.styleSheet(math.html))    
    return math.adaptor.outerHTML(node)
  }

  md.renderer.rules['display-math'] = (tokens,idx) => {
    return tokens[idx].content
  }
}