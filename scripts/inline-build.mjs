import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const distDir = path.join(projectRoot, 'dist')
const htmlPath = path.join(distDir, 'index.html')

let html = fs.readFileSync(htmlPath, 'utf8')

html = html.replace(
  /\s*<script>\s*\/\* If this source file is opened directly[\s\S]*?<\/script>/,
  '',
)

const faviconPath = path.join(distDir, 'favicon.svg')

if (fs.existsSync(faviconPath)) {
  const favicon = fs.readFileSync(faviconPath, 'utf8')
  const dataUri = `data:image/svg+xml,${encodeURIComponent(favicon)}`

  html = html.replace(
    /<link rel="icon"[^>]*>/,
    `<link rel="icon" type="image/svg+xml" href="${dataUri}" />`,
  )
}

html = html.replace(
  /<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+\.css)"[^>]*>/g,
  (match, filename) => {
    const css = fs.readFileSync(path.join(distDir, 'assets', filename), 'utf8')
    return `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`
  },
)

html = html.replace(
  /<script type="module"[^>]*src="\.\/assets\/([^"]+\.js)"[^>]*><\/script>/g,
  (match, filename) => {
    const js = fs.readFileSync(path.join(distDir, 'assets', filename), 'utf8')
    return `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`
  },
)

fs.writeFileSync(htmlPath, html)
fs.rmSync(path.join(distDir, 'assets'), { recursive: true, force: true })
console.log('Created self-contained dist/index.html')
