import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import { readFile, stat } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PRICES_PATH = resolve(__dirname, '..', 'GetData', 'prices.json')
const SCRAPER_SCRIPT = resolve(__dirname, '..', 'GetData', 'index.py')
const SCRAPER_CWD = resolve(__dirname, '..', 'GetData')
const PORT = process.env.PORT || 3001

const app = express()
app.use(cors())

// --- Helpers ---

async function readPrices() {
  const raw = await readFile(PRICES_PATH, 'utf-8')
  return JSON.parse(raw)
}

function runScraper() {
  return new Promise((resolve, reject) => {
    execFile('python', [SCRAPER_SCRIPT], { cwd: SCRAPER_CWD, timeout: 120_000 }, (err, stdout, stderr) => {
      if (err) {
        console.error('[scraper] error:', err.message)
        if (stderr) console.error('[scraper] stderr:', stderr)
        return reject(err)
      }
      if (stdout) console.log('[scraper]', stdout.trim())
      resolve()
    })
  })
}

// --- Routes ---

// GET /api/prices — return cached flat array
app.get('/api/prices', async (req, res) => {
  try {
    const data = await readPrices()
    res.json(data)
  } catch (err) {
    console.error('[/api/prices] Failed to read prices:', err.message)
    res.status(500).json({ error: 'Failed to load price data' })
  }
})

// GET /api/prices/refresh — run scraper, then return fresh data
app.get('/api/prices/refresh', async (req, res) => {
  try {
    console.log('[refresh] Running scraper...')
    await runScraper()
    const data = await readPrices()
    res.json(data)
  } catch (err) {
    console.error('[refresh] Scraper failed:', err.message)
    res.status(500).json({ error: 'Scraper failed', details: err.message })
  }
})

// GET /api/prices/meta — last scrape timestamp
app.get('/api/prices/meta', async (req, res) => {
  try {
    const info = await stat(PRICES_PATH)
    res.json({ lastUpdated: info.mtime.toISOString() })
  } catch (err) {
    res.status(500).json({ error: 'Could not read file metadata' })
  }
})

// --- Cron: refresh every 6 hours ---
cron.schedule('0 */6 * * *', async () => {
  console.log('[cron] Scheduled scrape starting...')
  try {
    await runScraper()
    console.log('[cron] Scrape complete.')
  } catch (err) {
    console.error('[cron] Scrape failed:', err.message)
  }
})

// --- Start ---
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
