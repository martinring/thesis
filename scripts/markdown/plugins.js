import md_spans from 'markdown-it-bracketed-spans';
import md_attrs from 'markdown-it-attrs';
import md_header_secs from 'markdown-it-header-sections';

/** @type {import('markdown-it').PluginSimple} */
export default function (md) {
  md.use(md_spans)
  md.use(md_attrs)
  md.use(md_header_secs)
}