# Security Audit Report — EnergyCompare Platform

**Date:** 2026-03-29
**Scope:** Frontend (public site) + SwthrhsDashboard (admin panel) + Supabase backend
**Overall Risk Level:** MEDIUM-HIGH (pre-production)

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH     | 4 |
| MEDIUM   | 6 |
| LOW      | 4 |
| **Total** | **17** |

---

## CRITICAL

### 1. File Uploads: Public URLs + No Server-Side Validation

**Files:**
- `Frontend/src/components/PlanDetailSidebar.jsx:345-352`

**Code:**
```js
const ext = file.name.split('.').pop()
const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
const { error } = await supabase.storage.from('uploads').upload(path, file)
const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
```

**Issues:**
- No whitelist on file extensions — attacker can upload `.exe`, `.html`, `.svg` with embedded scripts
- `getPublicUrl()` generates permanent public URLs with no expiry — anyone who discovers a URL has access forever
- `Math.random()` is not cryptographically secure — file paths are partially predictable
- No MIME type validation — only the user-provided extension is used
- No server-side file type enforcement on Supabase Storage bucket

**Impact:** Arbitrary file upload, permanent unauthorized access to uploaded documents (IDs, bills, personal documents), potential stored XSS via malicious SVG/HTML uploads.

**Remediation:**
1. Whitelist allowed extensions before upload:
   ```js
   const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg']
   const ext = file.name.split('.').pop().toLowerCase()
   if (!ALLOWED_EXTENSIONS.includes(ext)) {
     return { url: null, failed: true, name: file.name }
   }
   ```
2. Replace `getPublicUrl()` with `createSignedUrl()` (TTL 1 hour):
   ```js
   const { data: urlData } = await supabase.storage.from('uploads').createSignedUrl(path, 3600)
   ```
3. Replace `Math.random()` with `crypto.randomUUID()`:
   ```js
   const path = `${folder}/${crypto.randomUUID()}.${ext}`
   ```
4. Configure Supabase Storage bucket policies to restrict file types server-side
5. Set the bucket to private (not public)

---

### 2. Dashboard: User Creation via Anon Key (Privilege Escalation)

**Files:**
- `SwthrhsDashboard/src/components/AppSettingsTab.jsx:70-78`

**Code:**
```js
// Using signUp which works with anon key
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: newEmail,
  password: newPassword,
  options: { data: { display_name: newName } }
})
```

**Issues:**
- Uses `supabase.auth.signUp()` with the anonymous key instead of Admin API
- If Supabase project allows public signups (the default), anyone can create accounts by calling the Auth API directly — no dashboard needed
- Combined with missing RLS, a self-created account could access all data
- Passwords are sent and visible in browser DevTools Network tab

**Impact:** Unauthorized account creation, potential privilege escalation to admin role if RLS not enforced.

**Remediation:**
1. Disable public signups in Supabase Dashboard: Authentication > Settings > "Allow new users to sign up" = OFF
2. Create a Supabase Edge Function that uses the `service_role` key to invite users:
   ```js
   // Edge Function (server-side only)
   const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
   ```
3. Call the Edge Function from the dashboard instead of `signUp()`
4. Never expose service_role key to the frontend

---

### 3. Sensitive Customer Data Cached in localStorage

**Files:**
- `SwthrhsDashboard/src/lib/cache.js:19-21`
- `SwthrhsDashboard/src/components/CustomersTab.jsx:150`

**Code:**
```js
// cache.js
export function cacheSet(key, data, ttl = DEFAULT_TTL) {
  localStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttl }))
}

// CustomersTab.jsx
else { setSubmissions(data); cacheSet(CACHE_KEY, data) }
```

**Issues:**
- Full customer submissions (names, phone numbers, emails, AFM, IBAN, uploaded file URLs) are stored unencrypted in `localStorage`
- `localStorage` persists after browser close — data remains on disk indefinitely until TTL check
- TTL check only happens on read (stale data sits in localStorage until next `cacheGet()`)
- Any XSS vulnerability anywhere on the same origin gives full access to cached PII
- Shared computer scenario: next user opens DevTools > Application > localStorage > reads all customer data

**Impact:** GDPR violation, customer data breach on shared/compromised devices.

**Remediation:**
1. Replace `localStorage` with `sessionStorage` (auto-cleared when tab closes):
   ```js
   // cache.js — change all localStorage references to sessionStorage
   export function cacheSet(key, data, ttl = DEFAULT_TTL) {
     sessionStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttl }))
   }
   ```
2. Or remove caching of submissions entirely — use in-memory state only
3. Reduce TTL from 5 minutes to 1-2 minutes if caching is kept
4. Ensure `cacheClearAll()` runs on logout (currently does, but verify)

---

## HIGH

### 4. No Rate Limiting on Form Submissions

**Files:**
- `Frontend/src/lib/submissions.js:28-35`
- `Frontend/src/components/ContactForm.jsx`
- `Frontend/src/components/PlanDetailSidebar.jsx:360-496`

**Issues:**
- No rate limiting mechanism on any form submission endpoint
- `upsert_submission` and `update_submission_details` RPCs can be called unlimited times
- No CAPTCHA protection against bots
- An attacker can automate thousands of submissions via direct API calls

**Impact:** Database bloat, spam submissions, denial of service, potential cost increase on Supabase (row count/storage).

**Remediation:**
1. Add reCAPTCHA v3 to the contact form:
   ```js
   const token = await grecaptcha.execute('SITE_KEY', { action: 'submit' })
   // Pass token to RPC, verify server-side
   ```
2. Implement rate limiting via Supabase Edge Function (5 submissions per IP per hour)
3. Add a honeypot field to the form (hidden field that bots fill, humans don't)
4. Consider Supabase's built-in rate limiting on Auth endpoints

---

### 5. Client-Side Only Validation (No Server-Side Enforcement)

**Files:**
- `Frontend/src/components/ContactForm.jsx:47-61`
- `Frontend/src/components/PlanDetailSidebar.jsx:221-284`

**Code:**
```js
// AFM: only checks 9 digits, no checksum
const afmValid = /^\d{9}$/.test(detailForm.afm.trim())

// IBAN: only checks format, no mod-97 checksum
if (!/^GR\d{25}$/.test(ibanClean)) return false

// Email: permissive regex, accepts invalid emails like a@b.c
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))

// Phone: format only, no additional validation
if (!/^[0-9]{10}$/.test(formData.phone))

// Name: only checks empty, no max length
if (!formData.name || !formData.name.trim())
```

**Issues:**
- All validation is client-side only — bypassed with curl/Postman/DevTools
- AFM (Greek tax ID) has a specific mod-11 checksum algorithm that is not implemented
- IBAN has a mod-97 checksum that is not validated
- Email regex is too permissive
- No max length limits on any text fields (someone could submit 10MB of text as a name)
- No server-side validation in the RPC functions

**Impact:** Invalid data in database, fake submissions with invalid tax/bank details, potential database issues from oversized inputs.

**Remediation:**
1. Add validation inside the `upsert_submission` and `update_submission_details` RPCs:
   ```sql
   -- Example: AFM checksum in PostgreSQL
   CREATE OR REPLACE FUNCTION validate_afm(afm text) RETURNS boolean AS $$
   DECLARE
     s integer := 0;
     i integer;
   BEGIN
     IF length(afm) != 9 OR afm !~ '^\d{9}$' THEN RETURN false; END IF;
     FOR i IN 1..8 LOOP
       s := s + (substring(afm, i, 1)::integer * power(2, 9-i)::integer);
     END LOOP;
     RETURN (s % 11 % 10) = substring(afm, 9, 1)::integer;
   END;
   $$ LANGUAGE plpgsql IMMUTABLE;
   ```
2. Add CHECK constraints on the database columns
3. Set max lengths: name (255 chars), phone (20), email (320)
4. Implement proper IBAN mod-97 validation server-side

---

### 6. Dashboard Authorization is Client-Side Only

**Files:**
- `SwthrhsDashboard/src/App.jsx:73-75`
- `SwthrhsDashboard/src/components/AppSettingsTab.jsx:36-46`
- `SwthrhsDashboard/src/components/AppSettingsTab.jsx:121-135`

**Code:**
```js
// App.jsx — tab visibility is client-side only
const isAdmin = staffInfo?.role === 'admin'
const allowedTabs = isAdmin ? ALL_TABS : (staffInfo?.allowed_tabs || [])

// AppSettingsTab.jsx — no role check before staff operations
async function updateStaffField(userId, field, value) {
  const update = { [field]: value }
  if (field === 'role' && value === 'admin') {
    update.allowed_tabs = ALL_TABS
  }
  const { error } = await supabase.from('staff').update(update).eq('user_id', userId)
}

// No role check before deletion either
async function removeUser(userId, name) {
  const { error } = await supabase.from('staff').delete().eq('user_id', userId)
}
```

**Issues:**
- Tab access control is purely cosmetic (React state) — bypassed via DevTools or direct API calls
- `updateStaffField` does not verify the caller is an admin — any authenticated user can promote themselves
- `removeUser` does not verify admin role — any staff member could delete others
- If RLS policies are not active, this is a full privilege escalation vulnerability

**Impact:** Employee can promote themselves to admin, delete other staff, access all tabs and data.

**Remediation:**
1. **Primary defense:** Ensure RLS policies from `supabase_rls_policies.sql` are executed and active in the database. The SQL file already contains:
   ```sql
   CREATE POLICY staff_admin_update ON public.staff FOR UPDATE USING (public.is_admin());
   CREATE POLICY staff_admin_delete ON public.staff FOR DELETE USING (public.is_admin());
   ```
2. **Secondary defense:** Add client-side role checks as well:
   ```js
   async function updateStaffField(userId, field, value) {
     if (staffInfo?.role !== 'admin') {
       setError('Μόνο οι διαχειριστές μπορούν να κάνουν αυτή την ενέργεια')
       return
     }
     // ... rest of function
   }
   ```

---

### 7. RLS Policies: Written but Possibly Not Applied

**Files:**
- `supabase_rls_policies.sql` (root of project)
- `memory/project_rls_policies.md` (notes from previous conversation)

**Issues:**
- Comprehensive RLS policies exist in `supabase_rls_policies.sql` but the memory note (dated ~2026-03-17) indicates "frontend changes NOT YET DONE"
- If these policies have not been executed on the Supabase database, ALL tables are unprotected
- The policies are the single most important security control for this application
- Without them, the anon key gives full read/write access to all tables

**Impact:** Complete data breach — anyone with the anon key (which is in the frontend bundle) can read all customer data, modify plans/providers/settings, and escalate privileges.

**Remediation:**
1. **Verify immediately:** Log into Supabase Dashboard > Database > Tables > each table > Policies tab. Check if RLS is enabled and policies are listed
2. If not active, run the full `supabase_rls_policies.sql` against the database
3. Test each policy:
   ```sql
   -- Test as anon: should only be able to read plans, providers, settings
   -- Test as authenticated non-staff: should have minimal access
   -- Test as staff employee: should read submissions, not modify staff
   -- Test as staff admin: should have full access
   ```

---

## MEDIUM

### 8. Console Error Logging in Production

**Files:**
- `Frontend/src/App.jsx:62, 67, 103`
- `Frontend/src/components/PlanDetailSidebar.jsx:349, 491`
- `Frontend/src/components/ErrorBoundary.jsx:15`

**Code:**
```js
console.error('Failed to load plans:', plansRes.error)
console.error('Failed to load providers:', providersRes.error)
console.error(`Upload failed for ${file.name}:`, error)
console.error('Submit error:', err)
console.error('ErrorBoundary caught an error:', error, errorInfo)
```

**Issues:**
- Supabase error objects may contain table names, column names, constraint names, and SQL error details
- Visible to anyone opening browser DevTools
- Helps attackers understand database schema and application flow

**Remediation:**
Wrap in development-only check:
```js
if (import.meta.env.DEV) {
  console.error('Failed to load plans:', plansRes.error)
}
```
Or remove entirely and rely on error boundaries for user-facing feedback.

---

### 9. Missing Security Headers (CSP, X-Frame-Options)

**Files:**
- `Frontend/index.html`
- `SwthrhsDashboard/index.html`

**Issues:**
- No Content-Security-Policy header or meta tag
- No X-Frame-Options (clickjacking protection)
- No X-Content-Type-Options (MIME sniffing protection)
- No Referrer-Policy
- GitHub Pages does not allow custom server headers, so meta tags are the only option

**Remediation:**
Add to both `index.html` files inside `<head>`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://kit.fontawesome.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com https://ka-f.fontawesome.com;
  img-src 'self' data: blob: https://*.supabase.co;
  frame-ancestors 'none';
">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta name="referrer" content="strict-origin-when-cross-origin">
```

---

### 10. External Scripts Without Subresource Integrity (SRI)

**Files:**
- `Frontend/index.html:224-227`

**Code:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://kit.fontawesome.com/c0ed1af7ab.js" crossorigin="anonymous" defer></script>
```

**Issues:**
- FontAwesome loaded from CDN without integrity hash — if CDN is compromised, malicious JS executes in your app
- Google Fonts loaded externally — tracking concern + potential compromise vector
- No SRI (Subresource Integrity) attributes

**Remediation:**
1. For FontAwesome, self-host the kit or add SRI:
   ```html
   <script src="https://kit.fontawesome.com/c0ed1af7ab.js"
           integrity="sha384-[hash]"
           crossorigin="anonymous" defer></script>
   ```
2. Consider self-hosting Google Fonts (download via google-webfonts-helper)

---

### 11. Phone-Based Deduplication Collision in upsert_submission

**Files:**
- `supabase_rls_policies.sql:48-54` (RPC function)

**Code:**
```sql
SELECT id INTO v_id
FROM public.submissions
WHERE lead_info->>'phone' = v_phone
LIMIT 1;
```

**Issues:**
- Submission lookup is by phone number only
- If two different people share a phone number (family, business), the second submission overwrites the first person's data
- No additional discriminator (email, name, region)

**Remediation:**
Use compound lookup:
```sql
SELECT id INTO v_id
FROM public.submissions
WHERE lead_info->>'phone' = v_phone
  AND lead_info->>'email' = (p_lead_info->>'email')
LIMIT 1;
```

---

### 12. SVG Injection in Provider Logos

**Files:**
- `SwthrhsDashboard/src/components/ProvidersTab.jsx:10-14`

**Code:**
```js
function svgToDataUri(svg) {
  if (!svg || !svg.trim()) return null
  const trimmed = svg.trim()
  if (trimmed.startsWith('data:')) return trimmed
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(trimmed)))
}
```

**Issues:**
- SVG input from admin users is converted to data URI without sanitization
- SVGs can contain `<script>` tags, `onload` handlers, and other active content
- While `<img src="data:...">` is generally safe in modern browsers, older browsers or future rendering changes could be exploitable
- The raw SVG is also stored in the database and could be rendered unsafely elsewhere

**Remediation:**
1. Sanitize SVG input before storing:
   ```js
   import DOMPurify from 'dompurify'
   const cleanSvg = DOMPurify.sanitize(svgInput, { USE_PROFILES: { svg: true } })
   ```
2. Or accept only image uploads (PNG/JPG) instead of raw SVG markup

---

### 13. Auto-Refresh Without Warning

**Files:**
- `SwthrhsDashboard/src/App.jsx:34-38`

**Code:**
```js
const refreshInterval = setInterval(() => {
  cacheClearAll()
  window.location.reload()
}, 60 * 60 * 1000)
```

**Issues:**
- Hard reload every 60 minutes with no warning
- Any unsaved work (notes being typed, form fields being edited) is lost
- No user confirmation before reload

**Remediation:**
Replace with silent token refresh, or add a warning:
```js
const refreshInterval = setInterval(() => {
  if (confirm('Η σελίδα θα ανανεωθεί. Θέλετε να συνεχίσετε;')) {
    cacheClearAll()
    window.location.reload()
  }
}, 60 * 60 * 1000)
```

---

## LOW

### 14. No Email Verification

**Files:**
- `Frontend/src/components/ContactForm.jsx`
- `Frontend/src/components/formSteps/SpecificInfo.jsx`

**Issues:**
- Email is accepted without any verification step
- Typos go undetected
- Fake emails pollute the database
- No way to confirm the user owns the email address

**Remediation:** Send a verification email after submission, or implement double opt-in before processing the lead.

---

### 15. Error Messages Expose Internal Details

**Files:**
- `SwthrhsDashboard/src/components/AppSettingsTab.jsx:81`
- `SwthrhsDashboard/src/components/ProvidersTab.jsx:62`
- `SwthrhsDashboard/src/components/CustomersTab.jsx:162`

**Code:**
```js
if (authError) { setError(authError.message) }
if (error) setError(error.message)
```

**Issues:**
- Raw Supabase error messages displayed to users
- "User already registered" enables email enumeration
- Database constraint errors may reveal schema details

**Remediation:** Map errors to generic Greek messages:
```js
const userFacingMessage = error.message.includes('already registered')
  ? 'Ο χρήστης υπάρχει ήδη'
  : 'Προέκυψε σφάλμα. Δοκιμάστε ξανά.'
setError(userFacingMessage)
```

---

### 16. Silent Audit Log Failures

**Files:**
- `SwthrhsDashboard/src/lib/audit.js`

**Code:**
```js
export async function logAction(action, { entity, entityId, details } = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('audit_log').insert({...})
  } catch {
    // silent
  }
}
```

**Issues:**
- Audit log insert failures are silently swallowed
- No fallback logging mechanism
- Critical security actions (staff creation/deletion, role changes) may go unlogged

**Remediation:** Add fallback logging to console in dev, and consider a retry mechanism or secondary logging destination.

---

### 17. Missing .env.example Template

**Files:**
- Project root (missing file)

**Issues:**
- No `.env.example` or `.env.template` file exists
- Developers must guess required environment variables
- Increases risk of hardcoding secrets or misconfiguration

**Remediation:**
Create `.env.example` in both `Frontend/` and `SwthrhsDashboard/`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Pre-Production Checklist

### Fixed in code (completed)

- [x] **File uploads:** extension whitelist + MIME validation + signed URLs + crypto.randomUUID() — `PlanDetailSidebar.jsx`
- [x] **Replace localStorage with sessionStorage** in Dashboard cache (TTL reduced to 2min) — `cache.js`
- [x] **Admin role checks** on all staff operations (create/update/delete) — `AppSettingsTab.jsx`
- [x] **Password field** changed to type="password" with min length 8 — `AppSettingsTab.jsx`
- [x] **Console.error gated** behind `import.meta.env.DEV` — `App.jsx`, `PlanDetailSidebar.jsx`, `ErrorBoundary.jsx`
- [x] **Security headers** (X-Content-Type-Options, Referrer-Policy) — both `index.html`
- [x] **SVG sanitization** strips scripts, event handlers, dangerous elements — `ProvidersTab.jsx`
- [x] **Auto-refresh replaced** with silent `supabase.auth.refreshSession()` — Dashboard `App.jsx`
- [x] **Generic error messages** replace raw Supabase errors across all Dashboard tabs
- [x] **AFM checksum validation** (Greek mod-11 algorithm) — `PlanDetailSidebar.jsx`
- [x] **IBAN mod-97 validation** — `PlanDetailSidebar.jsx`
- [x] **Email regex strengthened** + max length checks (name 255, email 320) — `ContactForm.jsx`
- [x] **Audit log fallback** logs to console in dev — `audit.js`
- [x] **.env.example files** created for both apps
- [x] **File type i18n** messages added (EL + EN)

### Supabase Dashboard (completed)

- [x] **RLS policies active** — 23 policies across 6 tables (submissions, plans, providers, settings, staff, audit_log)
- [x] **Public signups disabled** in Supabase Auth settings
- [x] **Storage bucket `uploads` set to private**

### Additional fixes (completed)

- [x] **Honeypot anti-bot field** on contact form — `ContactForm.jsx`
- [x] **Server-side validation SQL** active — `supabase_rpc_validated.sql` (validates phone, email, name, region, contact_time, AFM checksum, IBAN mod-97)

### Remaining (nice-to-have)
- [ ] Implement rate limiting (Supabase Edge Function or external)
- [ ] Add email verification flow
- [ ] Self-host fonts and icons (or add SRI hashes)
- [ ] Fix phone-based deduplication collision in `upsert_submission` RPC
- [ ] Run `npm audit` and integrate into CI

---

## Architecture Notes

### What is already done well

- **No `dangerouslySetInnerHTML`** anywhere in the codebase — React's default escaping protects against XSS in rendered content
- **No `eval()` or `Function()` constructor** — the formula engine (`lib/formula.js`) uses safe JSON-based operations
- **No `postMessage`** — no cross-origin messaging vulnerabilities
- **RPC functions for submissions** — `upsert_submission` and `update_submission_details` are properly parameterized, no SQL injection risk
- **Dependencies are up-to-date** — React 19, Supabase JS 2.97, no known CVEs in direct dependencies
- **GitHub Actions secrets handling** — Supabase keys come from GitHub Secrets, not hardcoded in YAML
- **`.env` in `.gitignore`** — confirmed, never committed to git history
- **Minimal permissions in CI** — only `contents: read`, `pages: write`, `id-token: write`
- **Error Boundary** exists in Frontend for graceful error handling
- **Self-deletion prevention** in Dashboard staff management
- **Audit logging** exists for staff and customer operations

### Custom Vite fork note

`Frontend/package.json` uses `"vite": "npm:rolldown-vite@7.2.5"` — a community fork. Monitor for security updates as it may lag behind official Vite releases.
