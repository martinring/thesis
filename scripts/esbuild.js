import esbuild from 'esbuild'

// Javascript / CSS build
export default function build() {
  return esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outdir: "build/assets",
    platform: "browser",
    format: "esm",
    sourcemap: true,
    loader: {
      ".woff": "file",
      ".woff2": "file",
      ".ttf": "file"    
    }
  })
} 