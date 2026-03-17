import puppeteer from 'puppeteer'
import { createServer } from 'http'
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs'
import { resolve, join } from 'path'

const distPath = resolve('dist')
const indexPath = resolve(distPath, 'index.html')
const originalHtml = readFileSync(indexPath, 'utf-8')

// Simple static server that maps /swthrhs/* -> dist/*
const server = createServer((req, res) => {
  let filePath = req.url.replace(/^\/swthrhs/, '').split('?')[0]
  if (filePath === '/' || filePath === '') filePath = '/index.html'

  const fullPath = join(distPath, filePath)

  if (existsSync(fullPath) && statSync(fullPath).isFile()) {
    const ext = fullPath.split('.').pop()
    const mimeTypes = {
      html: 'text/html', js: 'application/javascript', css: 'text/css',
      json: 'application/json', svg: 'image/svg+xml', png: 'image/png',
      jpg: 'image/jpeg', woff2: 'font/woff2', woff: 'font/woff'
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' })
    res.end(readFileSync(fullPath))
  } else {
    // SPA fallback
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(readFileSync(indexPath))
  }
})

await new Promise(r => server.listen(4444, r))
console.log('Server running at http://localhost:4444/swthrhs/')

try {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()

  // Block external requests (Supabase etc.) that cause timeout in CI
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const url = req.url()
    if (url.startsWith('http://localhost')) {
      req.continue()
    } else {
      req.abort()
    }
  })

  await page.goto('http://localhost:4444/swthrhs/', { waitUntil: 'networkidle0', timeout: 30000 })

  // Wait for React components to render
  await page.waitForSelector('.feature-card', { timeout: 10000 }).catch(() => {
    console.log('Warning: .feature-card not found, checking if React rendered...')
  })

  const html = await page.content()
  await browser.close()

  if (html.includes('feature-card')) {
    writeFileSync(indexPath, html, 'utf-8')
    console.log(`Pre-rendered index.html (${(html.length / 1024).toFixed(1)} KB)`)
  } else {
    console.log('Pre-rendering skipped: React did not render. Keeping original HTML.')
  }
} catch (err) {
  console.log(`Pre-rendering failed: ${err.message}. Keeping original HTML.`)
} finally {
  server.close()
}
