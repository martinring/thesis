import esbuild from 'esbuild'

import * as log from './log.js'

// Javascript / CSS build
export default function build() {
  return esbuild.build({
    entryPoints: ["src/scripts/index.ts"],
    bundle: true,
    outdir: "build/assets",
    platform: "browser",
    format: "esm",
    sourcemap: true,
    loader: {
      ".woff": "file",
      ".woff2": "file",
      ".ttf": "file"    
    },
    logLevel: 'error'    
  }).then(res => {
    res.warnings.forEach(msg => {
      log.warn(msg.location.file + ":" + msg.location.line + ":" + msg.location.column + ": " + msg.text)
    })
  })
} 