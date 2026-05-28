import esbuild from 'esbuild'
import { sassPlugin } from 'esbuild-sass-plugin'
import { readdirSync } from 'fs'
import { basename, join } from 'path'

import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import postcssPresetEnv from 'postcss-preset-env';

const watch = process.argv.includes('--watch')

function sectionEntryPoints(dir, ext) {
  try {
    return readdirSync(dir)
      .filter((file) => file.endsWith(ext))
      .map((file) => ({
        out: `section-${basename(file, ext)}`,
        in: join(dir, file),
      }))
  } catch {
    return []
  }
}

const args = {
  entryPoints: [
    { out: 'theme', in: 'src/styles/theme.scss'},
    { out: 'theme', in: 'src/scripts/theme.js'},
    ...sectionEntryPoints('src/styles/sections', '.scss'),
    ...sectionEntryPoints('src/scripts/sections', '.js'),
  ],
  outdir: 'assets',
  target: ['es2018'],
  bundle: true,
  metafile: true,
  plugins: [
    sassPlugin({
      async transform(source) {
        const { css } = await postcss([autoprefixer, postcssPresetEnv]).process(source, { from: undefined })
        return css
      }
    })
  ]
}

let ctx
if (watch) {
  ctx = await esbuild.context(args)
  await ctx.watch()
  console.log('watching...', args)
} else {
  args.minify = true
  ctx = await esbuild.build(args)
  console.log('build successful', args)
}