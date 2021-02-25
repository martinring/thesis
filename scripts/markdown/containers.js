import md_container from 'markdown-it-container';

/** @type { import("markdown-it").PluginSimple } */
export default function (md) {
  md.use(md_container,'classes', {
    validate(params) {
      return true
    },
    render(tokens, idx) {
        const classes = tokens[idx].info.trim().split(/\s+/)
        if (tokens[idx].nesting === 1) {
            return `<div class="${classes.join(' ')}">\n`;
        } else {
            return '</div>\n';
        }
    }
  })    
}