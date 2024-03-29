import md_spans from 'markdown-it-bracketed-spans';
import md_attrs from 'markdown-it-attrs';
import md_header_secs from 'markdown-it-header-sections';
import table_captions from 'markdown-it-table-captions';
import definition_lists from 'markdown-it-deflist';
import metadata_block from 'markdown-it-metadata-block';
import yaml from 'yaml';
import fancy_lists from 'markdown-it-fancy-lists';
import multimd_table from 'markdown-it-multimd-table';

/** @type {import('markdown-it').PluginSimple} */
export default function (md) {
  md.use(md_spans)
  md.use(md_attrs)
  //md.use(md_header_secs)
  md.use(definition_lists)
  md.use(table_captions)
  md.use(metadata_block, { parseMetadata: yaml.parse })
  md.use(multimd_table)
  md.use(fancy_lists.markdownItFancyListPlugin)  
}