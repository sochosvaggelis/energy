/**
 * k6 Stress Test — Frontend / Supabase
 *
 * Τρέξε με:
 *   k6 run --env SUPABASE_URL=https://xxxx.supabase.co --env SUPABASE_ANON_KEY=eyJ... stress-test.js
 *
 * Ή βάλε τα env vars στο σύστημά σου και τρέξε απλά:
 *   k6 run stress-test.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// ── Custom metrics ──────────────────────────────────────────────────────────
const failRate      = new Rate('failed_requests')
const dataLoadTime  = new Trend('data_load_ms',   true)
const submitTime    = new Trend('submission_ms',  true)

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL      = __ENV.SUPABASE_URL      || 'https://REPLACE_ME.supabase.co'
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'REPLACE_ME'

const BASE_HEADERS = {
  'apikey':       SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

// ── Load profile ─────────────────────────────────────────────────────────────
// Σταδιακό ανέβασμα → σταθερό → κατέβασμα
export const options = {
  stages: [
    { duration: '30s', target: 10  },  // ramp-up σε 10 χρήστες
    { duration: '1m',  target: 10  },  // κράτα 10 χρήστες
    { duration: '30s', target: 30  },  // spike σε 30 χρήστες
    { duration: '1m',  target: 30  },  // κράτα 30 χρήστες
    { duration: '30s', target: 0   },  // ramp-down
  ],
  thresholds: {
    // Αν αποτύχει > 1% των requests → fail
    'failed_requests':   ['rate<0.01'],
    // 95% των data loads κάτω από 2s
    'data_load_ms':      ['p(95)<2000'],
    // 95% των submissions κάτω από 3s
    'submission_ms':     ['p(95)<3000'],
    // Γενικά: 95% κάτω από 3s
    'http_req_duration': ['p(95)<3000'],
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function randomPhone() {
  // Τυχαίο ελληνικό κινητό (10ψήφιο, αρχίζει 69x)
  const prefix = ['690','691','692','693','694','695','697','698','699'][Math.floor(Math.random() * 9)]
  const suffix = String(Math.floor(Math.random() * 9999999)).padStart(7, '0')
  return prefix + suffix
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const REGIONS       = ['attiki', 'thessaloniki', 'patra', 'larisa', 'other']
const CONTACT_TIMES = ['anytime', 'morning', 'noon', 'afternoon', 'evening']
const CUSTOMER_TYPES = ['residential', 'professional']
const PROVIDERS     = ['ΔΕΗ', 'ΗΡΩΝ', 'Volterra', 'Protergia', 'unknown']

// ── Main scenario ─────────────────────────────────────────────────────────────
export default function () {
  const headers = BASE_HEADERS

  // ── Step 1: Αρχικό φόρτωμα δεδομένων (plans + providers + settings) ───────
  const dataReqs = http.batch([
    ['GET', `${SUPABASE_URL}/rest/v1/plans?select=*,providers(name,adjustment_factor,logo_url)`, null, { headers }],
    ['GET', `${SUPABASE_URL}/rest/v1/providers?select=id,name,logo_url&order=name`, null, { headers }],
    ['GET', `${SUPABASE_URL}/rest/v1/settings?select=key,value`, null, { headers }],
  ])

  let dataOk = true
  dataReqs.forEach(res => {
    const ok = check(res, {
      'data load status 200': r => r.status === 200,
      'data load has body':   r => r.body && r.body.length > 2,
    })
    if (!ok) dataOk = false
    dataLoadTime.add(res.timings.duration)
    failRate.add(!ok)
  })

  sleep(randomBetween(1, 3)) // ο χρήστης διαβάζει τη φόρμα

  // ── Step 2: Υποβολή φόρμας (upsert_submission RPC) ────────────────────────
  const payload = JSON.stringify({
    p_lead_info: {
      name:         `Test User ${randomPhone()}`,
      phone:        randomPhone(),
      email:        null,
      region:       randomItem(REGIONS),
      contact_time: randomItem(CONTACT_TIMES),
      service_type: 'electricity',
    },
    p_electricity_info: {
      customer_type:       randomItem(CUSTOMER_TYPES),
      night_tariff:        Math.random() > 0.5,
      social_tariff:       false,
      current_provider:    randomItem(PROVIDERS),
      kwh_consumption:     Math.floor(Math.random() * 500) + 100,
      night_kwh_consumption: Math.floor(Math.random() * 100),
    },
  })

  const submitRes = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/upsert_submission`,
    payload,
    { headers }
  )

  const submitOk = check(submitRes, {
    'submission status 200': r => r.status === 200,
    'submission returns id':  r => {
      try { return !!JSON.parse(r.body) } catch { return false }
    },
  })

  submitTime.add(submitRes.timings.duration)
  failRate.add(!submitOk)

  sleep(randomBetween(1, 2))
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}
