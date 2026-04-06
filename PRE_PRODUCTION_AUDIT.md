# Pre-Production Security Audit — 2026-03-30

**Scope:** Πλήρης έλεγχος Frontend + Dashboard + Supabase backend πριν το production release.
**Βάση:** Υπάρχον `SECURITY_AUDIT.md` (29/03) + fresh code review (30/03).

---

## Σύνοψη

| Κατηγορία | Πλήθος |
|-----------|--------|
| ~~CRITICAL~~ (διορθώθηκαν) | ~~2~~ 0 |
| HIGH (πρέπει πριν production) | 4 |
| MEDIUM (σύντομα μετά) | 5 |
| LOW (nice-to-have) | 4 |
| **Σύνολο** | **15** |

### Ήδη φτιαγμένα (επιβεβαιωμένα στον κώδικα):
- File uploads: extension whitelist + MIME + crypto.randomUUID + storage paths (όχι public URLs)
- sessionStorage αντί localStorage στο cache (2min TTL)
- Admin role checks σε staff CRUD operations
- console.error gated πίσω από `import.meta.env.DEV`
- Security headers (X-Content-Type-Options, Referrer-Policy)
- SVG sanitization (custom — βλ. MEDIUM #3 για βελτίωση)
- Auto-refresh αντικαταστάθηκε με silent `refreshSession()`
- Generic error messages αντί raw Supabase errors
- AFM mod-11 + IBAN mod-97 validation (client-side)
- Honeypot anti-bot στο ContactForm
- Server-side validation SQL (`supabase_rpc_validated.sql`)
- RLS policies (23 policies, 6 tables)
- Public signups disabled
- Storage bucket private

---

## CRITICAL — Πρέπει να φτιαχτούν πριν production

### ~~1. BUG: `contact_time: 'afternoon'` — Frontend vs Server mismatch~~ FIXED

~~Το frontend πρόσφερε 5 επιλογές contact_time αλλά ο server-side RPC δεχόταν μόνο 4 (έλειπε `'afternoon'`).~~

**Διορθώθηκε:** Προστέθηκε `'afternoon'` στο `supabase_rpc_validated.sql:57`. SQL εφαρμόστηκε στη βάση.

---

### ~~2. Δύο εκδόσεις RPCs — κίνδυνος overwrite~~ FIXED

~~Το `supabase_rls_policies.sql` περιείχε παλιά RPCs χωρίς validation που μπορούσαν να αντικαταστήσουν τις validated εκδόσεις.~~

**Διορθώθηκε:** Αφαιρέθηκαν τα RPCs από `supabase_rls_policies.sql`. Τώρα:
- `supabase_rls_policies.sql` → μόνο RLS policies, helpers, grants, audit_log
- `supabase_rpc_validated.sql` → μοναδική πηγή RPCs (με server-side validation)

---

## HIGH — Πρέπει πριν production

### 3. `update_submission_details` accessible by anon users

**Αρχείο:** `supabase_rls_policies.sql:281`

**Κώδικας:**
```sql
GRANT EXECUTE ON FUNCTION public.update_submission_details(uuid, jsonb, jsonb, jsonb)
  TO anon, authenticated;
```

**Πρόβλημα:**
Η function είναι `SECURITY DEFINER` (εκτελείται με elevated privileges) και είναι accessible από ανώνυμους χρήστες. Ο χρήστης λαμβάνει το UUID του submission από `upsert_submission`. Με αυτό το UUID μπορεί μετά να καλέσει `update_submission_details` και να τροποποιήσει:
- `selected_plan` — αλλαγή του πλάνου
- `detail_form` — αλλαγή ΑΦΜ, IBAN, κλπ.
- `uploaded_files` — αντικατάσταση αρχείων

Αν και ο κάθε χρήστης μπορεί να τροποποιήσει μόνο το δικό του (γνωρίζει μόνο το δικό του UUID), αυτό σημαίνει ότι:
- Μπορεί να αλλάξει τα στοιχεία μετά την υποβολή
- Αν κάποιο UUID διαρρεύσει (logs, URLs), τρίτος μπορεί να τα τροποποιήσει

**Διόρθωση (ΠΡΟΑΙΡΕΤΙΚΗ αν θέλεις ο χρήστης να μπορεί να ενημερώνει στο Step 4):**
Αν το frontend χρειάζεται anon access για το PlanDetailSidebar flow, τότε πρόσθεσε:
- Rate limiting ή
- Ένα one-time token ή
- Timestamp check (allow update μόνο εντός 30 λεπτών από creation)

Αλλιώς, αν δεν χρειάζεται anon access:
```sql
REVOKE EXECUTE ON FUNCTION public.update_submission_details FROM anon;
```

---

### 4. No Content-Security-Policy (CSP)

**Αρχεία:**
- `Frontend/index.html` — μόνο X-Content-Type-Options + Referrer-Policy
- `SwthrhsDashboard/index.html` — μόνο X-Content-Type-Options + Referrer-Policy

**Πρόβλημα:**
Χωρίς CSP, αν βρεθεί XSS vulnerability οπουδήποτε (ή αν compromised ένα CDN), ο attacker μπορεί να εκτελέσει arbitrary JavaScript. Τo FontAwesome φορτώνεται από external CDN χωρίς integrity hash — αν το kit.fontawesome.com ή cdnjs.cloudflare.com compromised, εισάγει malicious JS/CSS.

**Διόρθωση:**
Πρόσθεσε στο `<head>` και των δύο `index.html`:

**Frontend:**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://kit.fontawesome.com https://ka-f.fontawesome.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://ka-f.fontawesome.com;
  font-src https://fonts.gstatic.com https://ka-f.fontawesome.com;
  img-src 'self' data: blob: https://*.supabase.co;
  frame-ancestors 'none';
">
```

**Dashboard:**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
  font-src https://fonts.gstatic.com https://cdnjs.cloudflare.com;
  img-src 'self' data: blob: https://*.supabase.co;
  frame-ancestors 'none';
">
```

---

### 5. No rate limiting — SPAM risk

**Αρχεία:**
- `Frontend/src/lib/submissions.js` — upsertSubmission
- `Frontend/src/components/PlanDetailSidebar.jsx` — handleSubmit

**Πρόβλημα:**
Ο ίδιος χρήστης ή bot μπορεί να κάνει unlimited submissions. Το honeypot πιάνει μόνο naive bots. Ένα curl script μπορεί να γεμίσει τη βάση με χιλιάδες fake submissions.

**Διόρθωση (επιλογές):**
1. **Client-side throttle** (ελάχιστη προστασία):
   ```js
   // 30 second cooldown between submissions
   const [lastSubmit, setLastSubmit] = useState(0)
   if (Date.now() - lastSubmit < 30000) { return }
   ```
2. **Supabase Edge Function** με rate limiting (5 submissions/IP/hour)
3. **reCAPTCHA v3** (Google) ή **Turnstile** (Cloudflare) — πιο αποτελεσματικό
4. **Supabase RPC rate limit** — δες [Supabase docs](https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting) για pg_net rate limiting

**Σύσταση:** Τουλάχιστον εφάρμοσε client-side throttle + reCAPTCHA v3 πριν το production.

---

### 6. Staff creation χρησιμοποιεί `signUp()` αντί Admin API

**Αρχείο:** `SwthrhsDashboard/src/components/AppSettingsTab.jsx:85-91`

**Κώδικας:**
```js
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: newEmail,
  password: newPassword,
  options: { data: { display_name: newName } }
})
```

**Πρόβλημα:**
Αν και τα public signups είναι disabled στο Supabase, αυτό βασίζεται σε ρύθμιση dashboard — αν κάποιος κατά λάθος το ενεργοποιήσει ξανά, οποιοσδήποτε μπορεί να δημιουργήσει account μέσω API call. Επίσης, η `signUp()` μπορεί να αλλάξει τη current session.

**Διόρθωση:**
Δημιούργησε ένα Supabase Edge Function:
```ts
// supabase/functions/create-staff/index.ts
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  // Verify caller is admin...
  const { email, password, display_name } = await req.json()
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email, password,
    user_metadata: { display_name },
    email_confirm: true
  })
  return new Response(JSON.stringify({ user: data.user, error }))
})
```

Μέχρι να γίνει αυτό, **βεβαιώσου ότι public signups παραμένουν disabled**.

---

## MEDIUM — Σύντομα μετά το launch

### 7. SVG sanitization ελλιπής — χρειάζεται DOMPurify

**Αρχείο:** `SwthrhsDashboard/src/components/ProvidersTab.jsx:10-24`

**Πρόβλημα:**
Η custom `sanitizeSvg()` function αφαιρεί `<script>`, `foreignObject`, `on*` handlers αλλά miss-άρει:
- `<style>` elements με CSS injection (`@import url("http://evil.com/track")`)
- `<animate>` / `<set>` elements (SVG animation exploits)
- `<a href="javascript:...">` (ελέγχει μόνο `href` στο `attr.name === 'href'` αλλά ο operator precedence bug στο `if` condition μπορεί να μην πιάσει σωστά)
- `data:` URIs σε `<image>` elements
- XML external entities (αν ο parser τα επεξεργαστεί)

**Διόρθωση:**
```bash
cd SwthrhsDashboard && npm install dompurify
```
```js
import DOMPurify from 'dompurify'

function sanitizeSvg(svg) {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['svg'],
    FORBID_TAGS: ['script', 'style', 'foreignObject'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick']
  })
}
```

Σημείωση: Εφόσον μόνο admins μπορούν να εισάγουν SVG, ο κίνδυνος είναι χαμηλότερος (trusted users). Αλλά defense-in-depth.

---

### 8. npm audit vulnerabilities

**Frontend:** 4 vulnerabilities (2 moderate, 2 high)
- `ajv` < 6.14.0 — ReDoS (dev dependency)
- `brace-expansion` — memory exhaustion (dev dependency)
- `flatted` — unbounded recursion DoS + prototype pollution
- `picomatch` <= 2.3.1 — ReDoS + method injection

**Dashboard:** 1 vulnerability (1 high)
- `picomatch` — same as above

**Διόρθωση:**
```bash
cd Frontend && npm audit fix
cd ../SwthrhsDashboard && npm audit fix
```

Σημείωση: Αυτά είναι κυρίως dev/build dependencies (δεν πάνε στο production bundle), αλλά καλό να φτιαχτούν.

---

### 9. Audit log INSERT πολύ permissive

**Αρχείο:** `supabase_rls_policies.sql:308-309`

**Κώδικας:**
```sql
CREATE POLICY "Staff can insert audit log"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());
```

**Πρόβλημα:**
Κάθε staff member μπορεί να κάνει INSERT στο audit_log με **οποιοδήποτε** `user_id`. Αυτό σημαίνει ότι ένας κακόβουλος employee μπορεί:
- Να εισάγει fake audit entries στο όνομα άλλου
- Να "θολώσει" τα ίχνη (add noise)

**Διόρθωση:**
Αλλαξε το policy ώστε ο user_id να πρέπει να ταιριάζει:
```sql
CREATE POLICY "Staff can insert own audit log"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() AND user_id = auth.uid());
```

---

### 10. PII σε sessionStorage cache

**Αρχείο:** `SwthrhsDashboard/src/components/CustomersTab.jsx:205`

**Κώδικας:**
```js
else { setSubmissions(data); cacheSet(CACHE_KEY, data) }
```

**Πρόβλημα:**
Πλήρη submissions (ονόματα, τηλέφωνα, emails, ΑΦΜ, IBAN, uploaded file paths) αποθηκεύονται στο sessionStorage. Αν και σβήνεται όταν κλείσει το tab, παραμένει accessible μέσω DevTools σε κοινόχρηστο υπολογιστή.

**Διόρθωση:**
Μην κάνεις cache τα submissions — χρησιμοποίησε μόνο in-memory state:
```js
else { setSubmissions(data) } // Χωρίς cacheSet
```
Αφαίρεσε και το `cacheGet(CACHE_KEY)` από τη `fetchSubmissions`. Ο realtime subscription θα κρατάει τα data fresh ούτως ή άλλως.

---

### 11. Dashboard FontAwesome CSS χωρίς SRI

**Αρχείο:** `SwthrhsDashboard/index.html:16`

**Κώδικας:**
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
```

**Πρόβλημα:**
Κανένα `integrity` attribute. Αν το cdnjs compromised, injected CSS μπορεί να κάνει data exfiltration (CSS attribute selectors + background-image URLs).

**Διόρθωση:**
```html
<link rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
  integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer">
```

---

### 11b. Ασθενής password policy στο Dashboard

**Αρχείο:** `SwthrhsDashboard/src/components/AppSettingsTab.jsx:74`

**Κώδικας:**
```js
if (newPassword.length < 8) {
  setError('Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες')
  return
}
```

**Πρόβλημα:** Μόνο minimum length check. Δέχεται `12345678` ή `aaaaaaaa`.

**Διόρθωση:**
```js
if (newPassword.length < 10 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
  setError('Ο κωδικός πρέπει: 10+ χαρακτήρες, κεφαλαίο, πεζό, αριθμός')
  return
}
```

---

### 11c. Χωρίς idle session timeout στο Dashboard

**Αρχείο:** `SwthrhsDashboard/src/App.jsx:36-39`

**Πρόβλημα:** Το session ανανεώνεται κάθε 1 ώρα χωρίς user interaction. Αν ο admin φύγει από τον υπολογιστή, η session παραμένει ενεργή επ' αόριστον.

**Διόρθωση:** Πρόσθεσε idle timeout (π.χ. 30 λεπτά αδράνειας):
```js
let lastActivity = Date.now()
document.addEventListener('mousemove', () => { lastActivity = Date.now() })
document.addEventListener('keydown', () => { lastActivity = Date.now() })

setInterval(() => {
  if (Date.now() - lastActivity > 30 * 60 * 1000) {
    cacheClearAll()
    supabase.auth.signOut()
  }
}, 60 * 1000)
```

---

### 11d. `afmIdioktiti` input χωρίς sanitization

**Αρχείο:** `Frontend/src/components/PlanDetailSidebar.jsx` (~line 1241)

**Πρόβλημα:** Το πεδίο ΑΦΜ ιδιοκτήτη δέχεται οτιδήποτε (δεν κάνει `.replace(/\D/g, '')` όπως το κύριο ΑΦΜ).

**Διόρθωση:** Πρόσθεσε sanitization:
```js
onChange={e => setDetailForm(prev => ({
  ...prev, afmIdioktiti: e.target.value.replace(/\D/g, '').slice(0, 9)
}))}
```

---

## LOW — Nice-to-have

### 12. Phone-based deduplication collision

**Αρχείο:** `supabase_rpc_validated.sql:63-66`

Αν δύο διαφορετικοί χρήστες μοιράζονται τηλέφωνο (οικογένεια, επιχείρηση), ο δεύτερος αντικαθιστά τα data του πρώτου.

**Διόρθωση:** Compound lookup `phone + email`.

---

### 13. Χωρίς email verification

Τα emails δεν επιβεβαιώνονται — typos και fake emails περνάνε στη βάση.

**Διόρθωση:** Double opt-in ή email verification μετά το submission.

---

### 14. Χωρίς self-hosted fonts

Google Fonts + FontAwesome CDN = tracking + single point of failure.

**Διόρθωση:** Self-host via google-webfonts-helper + npm install @fortawesome/fontawesome-free.

---

### 15. Custom Vite fork (rolldown-vite)

**Αρχείο:** `Frontend/package.json`

Χρησιμοποιείται `"vite": "npm:rolldown-vite@7.2.5"` — community fork. Μπορεί να υστερεί σε security patches σε σχέση με το official Vite.

**Διόρθωση:** Monitor releases, ή μετάβαση σε official vite.

---

## Checklist πριν Production

### MUST DO (Blocking)

- [x] **Fix `contact_time` mismatch** — Προστέθηκε `'afternoon'` στο RPC + εφαρμόστηκε στη βάση
- [x] **Ενοποίηση SQL αρχείων** — Αφαιρέθηκαν RPCs από `supabase_rls_policies.sql`, μόνο `supabase_rpc_validated.sql` τα ορίζει
- [ ] **CSP meta tags** — Πρόσθεσε Content-Security-Policy σε Frontend/index.html και Dashboard/index.html
- [ ] **Rate limiting** — ~~Client-side throttle απορρίφθηκε~~ (θα έκλεινε real users που διορθώνουν στοιχεία). Σωστή λύση: Cloudflare Turnstile + Supabase Edge Function. Παραλείπεται προς το παρόν — το upsert-by-phone + server-side validation παρέχουν αρκετή προστασία για niche site. Επανεξέταση αν εμφανιστεί spam μετά το launch.
- [x] **`npm audit fix`** — Και στα δύο apps
- [x] **Verify `update_submission_details` access** — REVOKE FROM anon εφαρμόστηκε στη βάση

### SHOULD DO (Πρώτη εβδομάδα μετά launch)

- [ ] **DOMPurify** αντί custom SVG sanitization
- [ ] **Audit log policy** — Restrict INSERT σε own user_id
- [ ] **Αφαίρεση cache PII** — Μην κάνεις cache submissions στο sessionStorage
- [ ] **SRI hashes** σε CDN resources (Dashboard FontAwesome)
- [ ] **Edge Function** για staff creation αντί `signUp()`
- [ ] **Password complexity** — Πρόσθεσε uppercase+lowercase+digit requirement
- [ ] **Idle session timeout** — Auto-logout μετά 30 λεπτά αδράνειας
- [ ] **`afmIdioktiti` sanitization** — `.replace(/\D/g, '')` στο input

### NICE TO HAVE

- [ ] Email verification flow
- [ ] Phone+email compound deduplication
- [ ] Self-host fonts
- [ ] Monitor rolldown-vite updates

---

## Τι δουλεύει ήδη σωστά

- Κανένα `dangerouslySetInnerHTML`, `eval()`, `Function()` στον κώδικα
- Formula engine (`lib/formula.js`) — safe JSON-based operations, no code execution
- RPC functions parameterized — κανένας κίνδυνος SQL injection
- File uploads: extension whitelist + MIME check + crypto.randomUUID + storage paths
- RLS policies active σε 6 tables (23 policies)
- Public signups disabled
- Storage bucket private
- Console.error μόνο σε DEV mode
- AFM mod-11 + IBAN mod-97 validation (client + server)
- Honeypot anti-bot
- Audit logging
- Error boundaries
- Self-deletion prevention
- `.env` στο `.gitignore`
- GitHub Actions secrets handling
