# EnergyCompare - Full Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Frontend](#frontend)
6. [Admin Dashboard](#admin-dashboard)
7. [Supabase Database](#supabase-database)
8. [Environment Variables](#environment-variables)
9. [Running Locally](#running-locally)
10. [Deployment](#deployment)
11. [Debugging Guide](#debugging-guide)

---

## Project Overview

EnergyCompare is a platform that allows Greek consumers to compare energy provider plans (electricity/gas) and submit applications to switch providers. The project consists of two separate React applications:

- **Frontend**: Public-facing website where users compare prices and submit applications
- **Admin Dashboard**: Internal staff tool for managing providers, plans, customer submissions, and user permissions

Both apps connect to a shared **Supabase** backend for database, authentication, and file storage.

---

## Architecture

```
User (Browser)
    |
    |--- Frontend (React, port 5173)
    |       |
    |       |--- Supabase (Database + Storage + Auth)
    |       |       |--- providers table
    |       |       |--- plans table
    |       |       |--- submissions table
    |       |       |--- settings table
    |       |       |--- staff table
    |       |       |--- uploads bucket (Storage)
    |       |
    |       |--- Backend API (Express, port 3001) [optional, for price scraping]
    |
    |--- Admin Dashboard (React, port 5174)
            |
            |--- Supabase (same project)
```

---

## Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Frontend         | React 19.2, Vite (rolldown-vite)    |
| Admin Dashboard  | React 19.2, Vite 6.x               |
| Database         | Supabase (PostgreSQL)               |
| Auth             | Supabase Auth (email/password)      |
| File Storage     | Supabase Storage                    |
| Icons            | Font Awesome 6.5 (CDN + React pkg)  |
| Fonts            | Plus Jakarta Sans (Google Fonts)    |
| Styling          | Custom CSS with CSS variables       |
| Deployment       | Cloudflare Pages                    |

---

## Project Structure

```
Swthrhs/
├── Frontend/                    # Public website
│   ├── src/
│   │   ├── App.jsx              # Root component, state management
│   │   ├── App.css
│   │   ├── components/
│   │   │   ├── Nav.jsx              # Navigation header
│   │   │   ├── Hero.jsx             # Landing section with form
│   │   │   ├── ContactForm.jsx      # 3-step lead capture form
│   │   │   ├── BasicInfo.jsx        # Step 1: customer type, tariffs
│   │   │   ├── ProviderInfo.jsx     # Step 2: current provider selection
│   │   │   ├── SpecificInfo.jsx     # Step 3: name, phone, email, region
│   │   │   ├── PriceSidebar.jsx     # Price comparison sidebar
│   │   │   ├── PlanDetailSidebar.jsx# Plan selection + document upload
│   │   │   ├── Features.jsx         # Feature highlights section
│   │   │   ├── HowItWorks.jsx       # How it works section
│   │   │   ├── FAQ.jsx              # FAQ accordion
│   │   │   ├── Testimonials.jsx     # Customer testimonials
│   │   │   ├── CTA.jsx              # Call-to-action section
│   │   │   ├── Footer.jsx           # Footer
│   │   │   ├── ThemeToggle.jsx      # Dark/light mode toggle
│   │   │   ├── LighitngBackground.jsx # WebGL lightning effect
│   │   │   └── styles/             # Component CSS files
│   │   └── lib/
│   │       └── supabase.js          # Supabase client
│   ├── index.html
│   ├── vite.config.js           # base: '/'
│   ├── package.json
│   └── .env                     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│
├── SwthrhsDashboard/            # Staff portal
│   ├── src/
│   │   ├── App.jsx              # Auth gate + tab routing + role filtering
│   │   ├── App.css
│   │   ├── index.css            # CSS variables (design system)
│   │   ├── components/
│   │   │   ├── LoginPage.jsx        # Email/password login
│   │   │   ├── Tabs.jsx             # Tab navigation
│   │   │   ├── ProvidersTab.jsx     # CRUD providers
│   │   │   ├── PlansTab.jsx         # Basic plan management
│   │   │   ├── PlansByCategoryTab.jsx # Advanced plan editor + formulas
│   │   │   ├── CustomersTab.jsx     # Submission management + notes
│   │   │   ├── SettingsTab.jsx      # Global variables (key/value)
│   │   │   ├── AppSettingsTab.jsx   # User management + role permissions
│   │   │   ├── FormulaBuilder.jsx   # Visual formula editor component
│   │   │   └── *.css               # Component styles
│   │   └── lib/
│   │       ├── supabase.js          # Supabase client
│   │       ├── cache.js             # LocalStorage cache (5min TTL)
│   │       └── formula.js           # Formula evaluation engine
│   ├── index.html               # Includes Font Awesome CDN
│   ├── vite.config.js           # base: '/', port 5174
│   ├── package.json
│   └── .env                     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│
└── Backend/                     # (currently empty, planned for price scraping)
```

---

## Frontend

### User Flow

```
1. User lands on homepage
2. Fills 3-step form:
   Step 1: Customer type (residential/professional), night tariff, social tariff
   Step 2: Current provider (DEI, Enerwave, Protergia, etc.)
   Step 3: Name, phone, email, region, preferred contact time
3. Form submits -> creates "submission" record in Supabase
4. Price sidebar opens -> shows plans sorted by monthly cost
5. User adjusts kWh slider to see personalized prices
6. User selects a plan -> Detail sidebar opens
7. Detail sidebar 4-step flow:
   Step 1: Plan summary
   Step 2: AFM, DOY, payment method, property status
   Step 3: Upload documents (bill, ID, meter photo, lease/E9)
   Step 4: Confirmation
8. Submission updated with plan + documents
```

### Key Components Detail

#### PriceSidebar.jsx
- **Non-linear kWh slider**: 0-500 linear, 500-5000 quadratic scaling
- **Dual sliders**: Day and night consumption (night appears only if night tariff = yes)
- **Tariff filters**: Σταθερο, Κυμαινομενο, Ειδικο, Δυναμικο
- **Monthly cost formula**: `(price_per_kwh * dayKwh) + (night_price_per_kwh * nightKwh) + monthly_fee_eur`
- **Sorting**: Plans sorted ascending by monthly cost, top 3 highlighted

#### PlanDetailSidebar.jsx
- **File uploads**: Stored in Supabase Storage bucket `uploads`
- **File path format**: `uploads/{submissionId}/{document_type}/{timestamp}_{randomId}.{ext}`
- **Accepted formats**: PDF, PNG, JPG, JPEG
- **Property types**: Ιδιοκτητης (owner), Διαχειριστης (manager), Ενοικιαστης (tenant)
- **Upload result**: Public URLs stored as arrays in `uploaded_files` JSON field

### Styling
- **Dark mode** (default) with optional light mode
- **CSS variables** defined in index.css and App.css
- **Theme toggle** saves preference to localStorage
- **Browser compatibility**: Meta tags prevent browsers from overriding colors

---

## Admin Dashboard

### Authentication Flow

```
1. User opens Admin Dashboard
2. App checks Supabase session
3. No session -> LoginPage (email/password)
4. Has session -> Fetch staff record from "staff" table
5. No staff record -> "No Access" screen
6. Has staff record -> Show only allowed tabs based on role
```

### Roles

| Role       | Access                                      |
|------------|---------------------------------------------|
| `admin`    | All tabs including "App Settings"           |
| `employee` | Only tabs listed in their `allowed_tabs`    |
| (no record)| "No Access" screen with logout button       |

### Tab Components

#### ProvidersTab
- **Table**: `providers`
- **Fields**: `name`, `adjustment_factor`
- **Features**: Search, inline editing, add modal, delete
- **Cache**: 5 min LocalStorage TTL

#### PlansTab
- **Table**: `plans` with `providers(name)` join
- **Fields**: `plan_name`, `tariff_type`, `provider_id`
- **Features**: Search, inline editing, add/delete

#### PlansByCategoryTab
- **Table**: `plans` with `providers(name, adjustment_factor)` join
- **Complex editor** for pricing:
  - **Static pricing**: Fixed `price_per_kwh`
  - **Formula pricing**: Dynamic calculation using variables from Settings
  - **Auto pricing**: Calculated from TEA fields (`tv`, `ll`, `lu`, `alpha`)
  - **Tiered pricing**: Different prices per kWh range (0-500, 500-2000, etc.)
- **FormulaBuilder**: Visual editor for creating price formulas

#### CustomersTab
- **Table**: `submissions`
- **Features**:
  - Table view with numbered rows (#, Name, Phone, Email, Region, Plan, Status, Date)
  - Click row to expand full details
  - Status management: Νεο -> Σε επεξεργασια -> Ολοκληρωμενο / Ακυρωμενο
  - **Notes sidebar**: Click comment icon to open sidebar, add/delete notes with author name
  - **File viewer**: Thumbnail previews for images, PDF icons for documents
  - **Lightbox**: Click image to view full-size
  - Status filter pills with counts
  - Search by name, phone, or email

#### SettingsTab
- **Table**: `settings`
- **Fields**: `key` (primary), `value`
- **Purpose**: Define variables (e.g. TEA, wholesale_price) used in formula builder

#### AppSettingsTab (admin only)
- **Table**: `staff`
- **Features**:
  - Create new users (calls `supabase.auth.signUp`)
  - Set display name, role, allowed tabs
  - Toggle individual tab access per user (checkboxes)
  - Remove staff members
  - Admin role auto-grants all tab access

### Cache System (lib/cache.js)

```javascript
cacheGet(key)              // Returns data if not expired, null otherwise
cacheSet(key, data, ttl)   // Stores with expiration (default 2 min)
cacheInvalidate(...keys)   // Removes specific cache entries
```

Storage key format: `admin_{key}` in sessionStorage (no PII stored).

### Formula Engine (lib/formula.js)

Formula structure:
```json
{
  "base_type": "variable",       // or "number"
  "base_value": "wholesale_price", // or 0.05
  "steps": [
    { "op": "+", "val_type": "number", "val": 0.02 },
    { "op": "*", "val_type": "variable", "val": "adjustment_factor" }
  ]
}
```

Functions:
- `evaluateFormula(formula, variables)` -> number (final calculated price)
- `formulaToDisplayParts(formula, variables)` -> { parts: [...], result: number }

---

## Supabase Database

### Tables

#### `providers`
| Column            | Type        | Notes                    |
|-------------------|-------------|--------------------------|
| id                | uuid (PK)   | Auto-generated           |
| name              | text        | Provider name            |
| adjustment_factor | numeric     | Multiplier for formulas  |
| created_at        | timestamptz | Auto-generated           |

#### `plans`
| Column              | Type        | Notes                              |
|---------------------|-------------|------------------------------------|
| id                  | uuid (PK)   | Auto-generated                     |
| provider_id         | uuid (FK)   | References providers.id            |
| plan_name           | text        |                                    |
| tariff_type         | text        | Σταθερο/Κυμαινομενο/Ειδικο/Δυναμικο|
| price_per_kwh       | numeric     | Static price (nullable)            |
| night_price_per_kwh | numeric     | Night rate (nullable)              |
| monthly_fee_eur     | numeric     | Monthly standing charge            |
| social_tariff       | boolean     | Social tariff eligibility          |
| tiers               | jsonb       | Tiered pricing array               |
| price_formula       | jsonb       | Dynamic price formula              |
| night_price_formula | jsonb       | Dynamic night price formula        |
| tv                  | numeric     | Auto-calc field                    |
| ll                  | numeric     | Auto-calc field                    |
| lu                  | numeric     | Auto-calc field                    |
| alpha               | numeric     | Auto-calc field                    |
| created_at          | timestamptz |                                    |

#### `submissions`
| Column           | Type        | Notes                              |
|------------------|-------------|------------------------------------|
| id               | uuid (PK)   | Auto-generated                     |
| lead_info        | jsonb       | {name, phone, email, region, contact_time} |
| electricity_info | jsonb       | {customer_type, night_tariff, social_tariff, current_provider, kwh_consumption, night_kwh_consumption} |
| selected_plan    | jsonb       | {provider, plan, tariff_type, price_per_kwh, night_price_per_kwh, monthly_fee_eur} |
| detail_form      | jsonb       | {afm, doy, pagia_entoli, allagi_onomatos, idpiothsia} |
| uploaded_files   | jsonb       | {logariasmos_mprosta, logariasmos_piso, tautotita_mprosta, tautotita_piso, metritis, misthotirio} |
| status           | text        | Νεο / Σε επεξεργασια / Ολοκληρωμενο / Ακυρωμενο |
| notes            | jsonb       | [{text, author, created_at}, ...]  |
| submitted_at     | timestamptz |                                    |
| created_at       | timestamptz |                                    |

#### `settings`
| Column     | Type        | Notes                    |
|------------|-------------|--------------------------|
| key        | text (PK)   | Variable name            |
| value      | text        | Variable value           |
| updated_at | timestamptz |                          |

#### `staff`
| Column       | Type        | Notes                              |
|--------------|-------------|------------------------------------|
| user_id      | uuid (PK)   | References auth.users.id           |
| display_name | text        | Shown in UI and notes              |
| role         | text        | "admin" or "employee"              |
| allowed_tabs | jsonb       | Array of tab names                 |
| created_at   | timestamptz |                                    |

### Storage Buckets

| Bucket   | Purpose                    | Access   |
|----------|----------------------------|----------|
| uploads  | Customer document uploads  | Private (signed URLs, 1h TTL) |

File path: `uploads/{submissionId}/{docType}/{uuid}.{ext}`

### Row Level Security (RLS) Policies

All tables have RLS enabled. Required policies:

```sql
-- submissions (for both anon Frontend inserts and authenticated Admin reads)
CREATE POLICY "Allow anon insert" ON public.submissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon read" ON public.submissions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated read" ON public.submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update" ON public.submissions FOR UPDATE TO authenticated USING (true);

-- staff
CREATE POLICY "Authenticated read staff" ON public.staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated update staff" ON public.staff FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated insert staff" ON public.staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated delete staff" ON public.staff FOR DELETE TO authenticated USING (true);

-- providers (anon read for Frontend, authenticated full for Admin)
CREATE POLICY "Allow anon read" ON public.providers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated all" ON public.providers FOR ALL TO authenticated USING (true);

-- plans (anon read for Frontend, authenticated full for Admin)
CREATE POLICY "Allow anon read" ON public.plans FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated all" ON public.plans FOR ALL TO authenticated USING (true);

-- settings
CREATE POLICY "Allow authenticated all" ON public.settings FOR ALL TO authenticated USING (true);
```

---

## Environment Variables

### Frontend (`Frontend/.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

### Admin Dashboard (`SwthrhsDashboard/.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

Both use the **same** Supabase project. The anon key is safe to expose (it's a public key). RLS policies control what each role can access.

---

## Running Locally

### Frontend
```bash
cd Frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Admin Dashboard
```bash
cd SwthrhsDashboard
npm install
npm run dev
# Runs on http://localhost:5174
```

### Both simultaneously
Open two terminals and run each dev server.

---

## Deployment

Hosted on **Cloudflare Pages**. Κάθε push στο `main` κάνει auto-deploy.

| App | URL |
|-----|-----|
| Frontend | https://comparegroup.gr |
| Admin Dashboard | https://admin.comparegroup.gr |

### Vite Base Paths
- Frontend: `base: '/'`
- Admin Dashboard: `base: '/'`

---

## Debugging Guide

### Common Issues

#### 1. "Δεν υπαρχουν υποβολες" but data exists in Supabase
**Cause**: Missing RLS policies. Supabase returns empty array instead of error when RLS blocks access.

**Fix**: Check that the correct role (anon/authenticated) has SELECT policy on the table:
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'submissions';

-- Add missing policy
CREATE POLICY "Allow authenticated read" ON public.submissions
FOR SELECT TO authenticated USING (true);
```

**How to verify**: Test directly with curl:
```bash
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://YOUR_PROJECT.supabase.co/rest/v1/submissions?select=*"
```
If this returns `[]` but data exists (visible in Supabase Dashboard with Role: postgres), it's an RLS issue.

#### 2. Icons not showing (comment, phone, etc.)
**Cause**: Font Awesome not loaded.

**Fix**: Ensure `index.html` includes:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
```

The Frontend uses the React Font Awesome package (`@fortawesome/react-fontawesome`), but the AdminDashboard uses the CDN with `<i className="fa-solid fa-...">` syntax.

#### 3. Login works but no tabs visible ("Δεν εχεις προσβαση")
**Cause**: User exists in `auth.users` but not in `staff` table.

**Fix**: Add staff record:
```sql
INSERT INTO public.staff (user_id, display_name, role, allowed_tabs)
SELECT id, 'Name', 'admin',
  '["Providers","Plans","Settings","App Settings"]'::jsonb
  || '["Πελάτες"]'::jsonb
  || '["Ανά Κατηγορία"]'::jsonb
FROM auth.users WHERE email = 'user@example.com';
```

#### 4. Notes not saving ("error" message)
**Cause**: Missing `notes` column on submissions table.

**Fix**:
```sql
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS notes jsonb DEFAULT '[]';
```

#### 5. Status changes not saving
**Cause**: Missing `status` column or UPDATE policy.

**Fix**:
```sql
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS status text DEFAULT 'Νέο';

-- Ensure policy exists
CREATE POLICY "Allow authenticated update" ON public.submissions
FOR UPDATE TO authenticated USING (true);
```

#### 6. File uploads failing in PlanDetailSidebar
**Cause**: Supabase Storage bucket not configured.

**Fix**:
1. Go to Supabase Dashboard -> Storage
2. Create bucket named `uploads`
3. Set it to **Public**
4. Add policy: Allow INSERT for anon/authenticated

#### 7. Formula prices showing NaN
**Cause**: Variable used in formula doesn't exist in `settings` table.

**Fix**: Check Settings tab in Admin Dashboard. Ensure all variables referenced in formulas (e.g., `wholesale_price`, `TEA`) have values in the settings table.

#### 8. Cache showing stale data
**Cause**: LocalStorage cache (5 min TTL) serving old data.

**Fix**: Click "Ανανεωση" (refresh) button in the tab, which calls `fetchX(true)` to skip cache. Or clear manually:
```javascript
// In browser console
Object.keys(localStorage).filter(k => k.startsWith('cache_')).forEach(k => localStorage.removeItem(k))
```

#### 9. User creation in App Settings fails
**Cause**: `supabase.auth.signUp()` requires email confirmation by default.

**Fix**: In Supabase Dashboard -> Authentication -> Settings:
- Disable "Enable email confirmations" for development
- Or use the Supabase Dashboard to manually create and confirm users

#### 10. Dark mode not applying properly
**Cause**: Some browsers override site colors with their own dark mode.

**Fix**: Already handled with meta tags in Frontend:
```html
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
```

### Debug Checklist

When something doesn't work, check in this order:

1. **Browser Console** (F12): Look for JavaScript errors or failed network requests
2. **Network Tab**: Check if Supabase API calls return 200 with data or empty arrays
3. **Supabase Dashboard**:
   - Table Editor: Verify data exists (switch Role to `postgres` to bypass RLS)
   - Authentication -> Users: Verify user exists and is confirmed
   - Authentication -> Policies: Check RLS policies for the relevant table
4. **Environment Variables**: Verify `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. **Cache**: Clear localStorage cache if data seems stale
6. **Build**: Run `npx vite build` to check for compile errors

### Useful SQL Queries

```sql
-- See all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE schemaname = 'public';

-- See all staff members and their access
SELECT s.display_name, s.role, s.allowed_tabs, u.email
FROM public.staff s
JOIN auth.users u ON u.id = s.user_id;

-- See submission counts by status
SELECT status, COUNT(*) FROM public.submissions GROUP BY status;

-- See all settings variables
SELECT * FROM public.settings ORDER BY key;

-- Check if a specific user has a staff record
SELECT * FROM public.staff WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);
```

### Port Reference

| Service          | Port  | URL                              |
|------------------|-------|----------------------------------|
| Frontend Dev     | 5173  | http://localhost:5173             |
| Admin Dashboard  | 5174  | http://localhost:5174             |
| Backend API      | 3001  | http://localhost:3001/api/prices  |

### Deployed URLs

| App              | URL                              |
|------------------|----------------------------------|
| Frontend         | https://comparegroup.gr          |
| Admin Dashboard  | https://admin.comparegroup.gr    |
