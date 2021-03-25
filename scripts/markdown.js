import markdown from 'markdown-it';
import fs from 'fs/promises';
import path from 'path'
import url from 'url';
import * as log from './log.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function (options) {  
  const md = new markdown(options)
  const plugins = (await fs.readdir(__dirname + '/markdown')).filter(x => x.endsWith('.js'))
  await Promise.all(plugins.map(file => log.timed('markdown use ' + file, import('./markdown/' + file).then(x => md.use(x.default)))))
  return md
}