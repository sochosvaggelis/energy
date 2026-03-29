# CLAUDE.md

Greek energy provider comparison platform. Two React apps sharing one Supabase backend.

## Apps

| App | Path | Port | Base path | Deploy URL |
|-----|------|------|-----------|------------|
| Frontend (public site) | `Frontend/` | 5173 | `/swthrhs/` | vagggelaras.github.io/swthrhs/ |
| Admin Dashboard | `SwthrhsDashboard/` | 5174 | `/SwthrhsDashboard/` | vagggelaras.github.io/SwthrhsDashboard/ |

## Stack

React 19 + Vite + Supabase (Postgres + Auth + Storage). CSS variables for theming (dark/light). GitHub Pages via Actions CI. Pre-rendering with Puppeteer (Frontend only, skipped in CI).

## Commands

```bash
# Dev
cd Frontend && npm i && npm run dev
cd SwthrhsDashboard && npm i && npm run dev

# Build
cd Frontend && npm run build    # vite build + prerender.mjs
cd SwthrhsDashboard && npm run build
```

## Env vars (both apps, same Supabase project)

`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — anon key is public (RLS enforces access). Template files: `Frontend/.env.example`, `SwthrhsDashboard/.env.example`.

## DB tables

- `providers` — energy companies (id, name, adjustment_factor, has_gas, logo_url, info_text)
- `plans` — tariffs (provider_id FK, price_per_kwh, night_price, monthly_fee, tiers jsonb, price_formula jsonb, tv/ll/lu/alpha for auto pricing)
- `submissions` — customer leads (lead_info, electricity_info, selected_plan, detail_form, uploaded_files — all jsonb)
- `settings` — global key/value config
- `staff` — admin users (user_id FK auth.users, role admin/employee, allowed_tabs jsonb)
- `audit_log` — admin action log (user_id, action, entity, details, created_at)

## Security

- **RLS enabled** on all tables (23 policies across 6 tables). SQL in `supabase_rls_policies.sql`.
- **RPCs**: `upsert_submission()`, `update_submission_details()` — SECURITY DEFINER, server-side validated. Validation SQL in `supabase_rpc_validated.sql`.
- **Auth**: Public signups disabled. Staff accounts created by admin only via Dashboard.
- **Storage**: `uploads` bucket is private. Files accessed via signed URLs (1h TTL). Frontend stores storage paths (not public URLs) in `uploaded_files` jsonb.
- **File uploads**: Extension whitelist (`pdf, png, jpg, jpeg, webp, heic, heif`) + MIME type validation + `crypto.randomUUID()` for filenames.
- **Input validation**: Client-side (AFM mod-11 checksum, IBAN mod-97, email regex, max lengths) + server-side in RPCs.
- **Anti-bot**: Honeypot field on ContactForm.
- **Dashboard auth guards**: Admin role checked client-side before staff CRUD operations. RLS enforces server-side.
- **Caching**: `sessionStorage` with 2min TTL (no PII in localStorage).
- **Error messages**: Generic user-facing messages; raw Supabase errors only shown in dev mode.
- **SVG sanitization**: Provider logos stripped of scripts/event handlers before storage.
- **Security headers**: X-Content-Type-Options, Referrer-Policy on both apps.
- Full audit in `SECURITY_AUDIT.md`.

## Key architecture

- **Frontend flow**: 3-step ContactForm (with honeypot) → upsertSubmission RPC → PriceSidebar (plan comparison) → PlanDetailSidebar (4-step: summary → details → doc upload → confirm)
- **Admin flow**: Login → staff role check → tab-gated UI (Providers, Plans, PlansByCategory, Customers, Settings, StatusSettings, AppSettings)
- **Formula engine**: `lib/formula.js` in both apps — `evaluateFormula()`, `computeAutoPrice()`, `resolvePlanPrice()`. Formulas are jsonb with base_type (variable/number/auto) + steps array.
- **File uploads**: Supabase Storage bucket `uploads/{submissionId}/{docType}/{uuid}.{ext}`. Private bucket, signed URLs only. Dashboard uses `FileThumb` component to resolve paths → signed URLs on demand.
- **Caching** (Dashboard only): `lib/cache.js` — sessionStorage with 2min TTL, keys prefixed `admin_`.
- **State**: React hooks only (no Redux/context). App.jsx holds top-level state.
- **Session refresh**: Dashboard silently refreshes Supabase auth session every hour (no hard reload).

## File conventions

- Components in `src/components/`, multi-step forms in `formSteps/`
- Styles as co-located CSS files in `components/styles/`
- Data layer in `src/lib/` (supabase.js, submissions.js, formula.js, cache.js, audit.js)
- Functional components with hooks. Sidebar animations use clip-path.
- Console.error calls gated behind `import.meta.env.DEV` — no logging in production builds.

## CI/CD

`.github/workflows/deploy.yml` — push to main triggers build+deploy. Node 20. Sets `PUPPETEER_SKIP_DOWNLOAD=true`. Supabase keys from GitHub secrets.

## Known issues (see TODO.txt)

`LighitngBackground.jsx` filename typo, `FormulaBuilder` component unused, dead footer links. Rate limiting not yet implemented. Phone-based deduplication in `upsert_submission` could collide if two users share a phone number.
