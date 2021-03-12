/** @type { import("markdown-it").PluginSimple} */
export default function (md) {
  md.inline.ruler.after('emphasis', 'footnote', (state) => {
    var max = state.posMax

    if (state.src.charCodeAt(state.pos) !== 0x5E || state.src.charCodeAt(state.pos + 1) !== 0x5B) {
      // ^[
      return false;
    }    

    var labelStart = state.pos + 2;
    var labelEnd   = state.md.helpers.parseLinkLabel(state, state.pos + 1, true);

    if (labelEnd < 0) {
      return false;
    }

    var pos = labelEnd + 1;
    if (pos < max) {
      state.pos = labelStart;
      state.posMax = labelEnd;            
      
      state.push('footnote_open', 'span', 1).attrSet('class','footnote')      
      state.md.inline.tokenize(state)
      state.push('footnote_close','span',-1)
          
      state.pos = pos;
      state.posMax = max;
      return true;
    }
    return false
  })
}