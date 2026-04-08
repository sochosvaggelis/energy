# SITE_STATUS.md
Κατάσταση του site — ενημερώνεται χειροκίνητα.

---

## Deployment

| | URL | Κατάσταση |
|--|-----|-----------|
| Frontend | https://comparegroup.gr | ✅ Live |
| Dashboard | https://admin.comparegroup.gr | ⏳ Custom domain pending |
| Frontend (Cloudflare) | https://comparegroup.vsoh77.workers.dev | ✅ Live |
| Dashboard (Cloudflare) | https://swthrhsdashboard.vsoh77.workers.dev | ✅ Live |

---

## Εκκρεμή για να δουλέψει το domain

- [x] Cloudflare Pages → **comparegroup** project → Custom domains → Add `comparegroup.gr` + `www.comparegroup.gr`
- [ ] Cloudflare Pages → **swthrhsdashboard** project → Custom domains → Add `admin.comparegroup.gr`
- [x] Επαλήθευση ότι φορτώνει https://comparegroup.gr
- [ ] Επαλήθευση ότι φορτώνει https://admin.comparegroup.gr
- [ ] Login Dashboard λειτουργεί
- [ ] Form submission λειτουργεί (πλήρης ροή)
- [ ] File upload λειτουργεί

---

## Πριν το επίσημο launch (production-ready)

- [ ] **Revert noindex** — το site είναι κρυμμένο από Google:
  - `Frontend/public/robots.txt` → άλλαξε `Disallow: /` σε `Allow: /` και πρόσθεσε: `Sitemap: https://comparegroup.gr/sitemap.xml`
  - `Frontend/index.html` → αφαίρεσε: `<meta name="robots" content="noindex, nofollow">`
- [ ] **Sitemap** — ενημέρωσε `Frontend/public/sitemap.xml` με `comparegroup.gr` URLs (αντί για `vagggelaras.github.io/swthrhs/`)
- [ ] **Google Search Console** — πρόσθεσε το `comparegroup.gr` και κάνε submit sitemap
- [ ] **Google Analytics / tracking** — αν χρειάζεται
- [ ] Rate limiting — δεν έχει υλοποιηθεί ακόμα (βλ. Known Issues)
- [ ] Τελικός έλεγχος ασφάλειας

---

## Known Issues (από pre-production audit)

- **Rate limiting**: Δεν υπάρχει — το form μπορεί να υποβληθεί απεριόριστες φορές.
- **Phone deduplication**: Αν δύο χρήστες έχουν ίδιο τηλέφωνο, ο `upsert_submission` RPC μπορεί να κάνει collision.
- Πλήρης λίστα: `PRE_PRODUCTION_AUDIT.md`

---

## Cloudflare Pages — Auto-deploy

Κάθε `git push` στο `main` → Cloudflare Pages κάνει αυτόματα rebuild και deploy.
Δεν χρειάζεται χειροκίνητο deploy.

---

## Supabase

- Site URL: `https://comparegroup.gr` ✅
- Redirect URLs: `https://comparegroup.gr/**` και `https://admin.comparegroup.gr/**` ✅

---

_Τελευταία ενημέρωση: 2026-04-08 — comparegroup.gr live_
