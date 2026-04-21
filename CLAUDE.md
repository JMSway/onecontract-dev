# OneContract

## Deployment
Two repositories:
- **onecontract-dev** (this repo): development, has CLAUDE.md and AI tooling
- **onecontract** (production): clean code, no AI markers, connected to domain

To deploy to production run: ./scripts/deploy-production.sh
This script: copies project → removes CLAUDE.md, AGENTS.md → strips AI comments → pushes to onecontract repo with human author.
NEVER push CLAUDE.md or AGENTS.md to production repo.

Electronic contract platform for educational centers in Kazakhstan.
Language schools as anchor segment → IT courses & online schools in wave 2.

## Problem we solve
Schools don't use contracts with students → lose money on refunds, can't prove terms in disputes, tax risks.
We're NOT competing with existing EDO (TrustMe, Documentolog). We CREATE contracts where none existed.

## Tech stack
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Deploy**: Vercel (frontend + API routes)
- **PDF**: pdf-lib (generation), react-pdf (viewer)
- **SMS**: Mobizon.kz API or sms.kz
- **e-Signature**: SIGEX API (eGov QR, free tier, 40 docs/month)
- **AI**: Claude API (template field extraction from uploaded Word/PDF)
- **Email**: Resend (free 100/day)

## Project structure
```
/app
  /page.tsx                    — Landing (7 sections)
  /auth/login/page.tsx         — Login
  /auth/register/page.tsx      — Register org
  /dashboard/page.tsx          — Contract list + stats
  /dashboard/templates/page.tsx — Template management (owner only)
  /dashboard/team/page.tsx     — Manage members (owner only)
  /dashboard/contracts/new/page.tsx — Create contract from template
  /sign/[contractId]/page.tsx  — Public signing page (mobile-first, no auth)
  /api/auth/                   — Auth endpoints
  /api/contracts/              — CRUD contracts
  /api/sign/                   — SMS OTP + SIGEX eGov QR
  /api/templates/              — Template CRUD + AI extraction
  /api/notify/                 — SMS + Email notifications
/components
  /ui/          — Buttons, inputs, modals (Tailwind)
  /layout/      — Header, sidebar, footer
  /dashboard/   — Contract table, stats cards
  /signing/     — PDF viewer, OTP input, QR display
  /landing/     — Hero, problem, solution, pricing sections
/lib
  supabase.ts   — Supabase client init
  pdf.ts        — PDF generation from template data
  sms.ts        — SMS provider wrapper
  sigex.ts      — SIGEX API wrapper (3 endpoints)
  ai.ts         — Claude API for template extraction
  hash.ts       — SHA-256 hashing for signed PDFs
  types.ts      — Shared TypeScript types
```

## Database schema (Supabase PostgreSQL)
```sql
-- Organizations (schools)
organizations (id uuid PK, name, bin, address, phone, email, created_at)

-- Users with roles
users (id uuid PK, org_id FK, email, role ENUM('owner','manager'), needs_approval bool DEFAULT true, created_at)

-- Contract templates
templates (id uuid PK, org_id FK, name, description, fields jsonb, source_file_url text, created_by FK, created_at)
-- fields example: [{"key":"student_name","label":"ФИО ученика","type":"text"},{"key":"iin","label":"ИИН","type":"iin"}]

-- Contracts
contracts (id uuid PK, org_id FK, template_id FK, data jsonb, pdf_url text, pdf_hash text, status ENUM('draft','pending_approval','sent','viewed','signed','declined'), sent_via ENUM('sms','email'), recipient_phone, recipient_email, created_by FK, approved_by FK, created_at, sent_at, viewed_at, signed_at)

-- Signatures
signatures (id uuid PK, contract_id FK, method ENUM('sms_otp','egov_qr'), signer_ip, signer_ua, signer_iin, otp_code, otp_verified_at, egov_signature_data text, created_at)

-- Audit log
audit_log (id uuid PK, contract_id FK, action text, actor text, ip text, ua text, created_at)
```

## Roles & permissions
| Action | Owner | Manager |
|--------|-------|---------|
| Create templates | ✅ | ❌ |
| Add/remove managers | ✅ | ❌ |
| Set needs_approval per manager | ✅ | ❌ |
| Fill contract from template | ✅ | ✅ |
| Send to client | ✅ always | ✅ or ⏳ waits approval |
| Approve manager's send | ✅ | ❌ |
| View all org contracts | ✅ | own only |
| Download signed PDFs | ✅ | own only |

## Signing flow (critical path)
1. Manager fills form → selects channel (SMS/Email)
2. If needs_approval=true → status='pending_approval' → owner gets notification
3. Owner approves → status='sent' → client receives link
4. Client opens link → sees consent checkbox (PD processing) → agrees
5. Client views PDF in browser (react-pdf, no download required)
6. Client signs: SMS OTP code OR eGov QR scan
7. On sign: PDF gets SHA-256 hash, status='signed', becomes immutable
8. Both parties receive signed PDF copy (SMS/email)
9. If declined: status='declined', reason logged, owner notified

## Template creation flow (AI-powered)
1. Owner uploads Word/PDF of their existing contract
2. Backend sends document text to Claude API
3. Claude extracts variable fields: student name, IIN, dates, amounts, course name
4. System creates template with field definitions (JSON)
5. When creating new contract: manager fills form → system generates clean PDF with data inserted
6. Original document layout is NOT preserved — system generates new clean PDF

## SIGEX integration (eGov QR signing)
Uses npm package: sigex-qr-signing-client
Free tier: 40 docs/month, no registration needed for basic QR
3 API calls: POST /api/egovQr → POST /api/egovQr/{qrId} → GET /api/egovQr/{qrId}
Result: legally equivalent to EDS/ЭЦП signature

## SMS OTP flow
1. Generate 6-digit code, store in signatures table with expiry (5 min)
2. Send via SMS provider API
3. Client enters code on signing page
4. Verify: match code + check expiry + log IP/UA/time

## Security requirements (MVP level)
- Supabase RLS on all tables (org isolation)
- JWT auth via Supabase Auth
- SHA-256 hash on signed PDFs (immutability proof)
- Audit log: every action tracked (IP, UA, timestamp)
- PD consent checkbox before viewing contract
- No NCALayer, no KalkanCrypt SDK

## Landing page (7 sections)
1. Hero: headline about school pain + CTA "Попробовать бесплатно"
2. Problem: "Школы теряют деньги без договоров"
3. Solution: 3 steps with icons
4. Social proof: testimonials (placeholder for MVP)
5. How it works: 30-60s video placeholder
6. Pricing: 2-3 tiers, transparent
7. Final CTA + footer

## NOT in MVP (phase 2-3)
- WhatsApp Business API integration
- Drag-and-drop visual template editor
- Bulk send (Excel import)
- 1C integration
- Contract renewal/extension automation
- Complex animations
- Mobile native app
- Multi-language (kz/en)

## Brand & design system
**Color palette — use ONLY these values:**
```
--color-navy:       #000926  /* dark bg: hero, footer, dark sections */
--color-sapphire:   #0F52BA  /* primary: CTA buttons, links, icons */
--color-powder:     #A6C5D7  /* secondary: borders, dividers, hover states */
--color-ice:        #D6E6F3  /* light bg: section backgrounds, cards */
--color-white:      #FFFFFF  /* main bg, text on dark */
--color-text:       #0D1B2A  /* body text */
--color-muted:      #6B7E92  /* subtitles, descriptions, placeholders */
--color-success:    #0F7B55  /* signed status, success states */
--color-warning:    #B45309  /* pending status */
--color-danger:     #B91C1C  /* declined status, errors */
```

**Tailwind config — extend with brand colors:**
```js
// tailwind.config.ts
colors: {
  navy: '#000926',
  sapphire: '#0F52BA',
  powder: '#A6C5D7',
  ice: '#D6E6F3',
  'text-dark': '#0D1B2A',
  muted: '#6B7E92',
}
```

**Typography:**
- Font: Inter (Google Fonts) — already in Next.js by default
- Hero headline: text-5xl md:text-7xl font-bold text-white (on navy bg)
- Section headline: text-3xl md:text-4xl font-semibold text-text-dark
- Body: text-base text-muted leading-relaxed
- Labels/caps: text-xs font-semibold uppercase tracking-widest text-powder

**Component patterns:**
- Primary button: bg-sapphire hover:bg-blue-700 text-white rounded-xl px-6 py-3 font-semibold
- Secondary button: border border-powder text-text-dark hover:bg-ice rounded-xl px-6 py-3
- Card: bg-white border border-ice rounded-2xl p-6 shadow-sm
- Dark section: bg-navy text-white
- Light section: bg-ice or bg-white
- Status badge signed: bg-green-50 text-green-700 border border-green-200
- Status badge pending: bg-amber-50 text-amber-700 border border-amber-200
- Status badge declined: bg-red-50 text-red-700 border border-red-200

**Animations (framer-motion only — keep lightweight):**
- Section fade-in on scroll: opacity 0→1, y 20→0, duration 0.5s
- Button hover: scale 1.02, duration 0.15s
- Sticky CTA bar: appears after hero scrolls out of view
- NO: parallax, 3D transforms, complex sequences, page transitions

**Layout rules:**
- Max content width: max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
- Section padding: py-20 md:py-28
- Mobile-first always (design for 375px first)
- Border radius: rounded-xl (buttons/inputs), rounded-2xl (cards), rounded-full (badges/avatars)

## Icons — lucide-react ONLY
- Package: `lucide-react` (installed)
- Import: `import { Shield, Clock, FileText, Send, Check, ... } from 'lucide-react'`
- NEVER draw SVG icons manually — always use lucide-react
- Size: `size={24}` inline, `size={32}` cards, `size={48}` hero features
- Color: `className="text-sapphire"` on light bg, `"text-powder"` on dark bg
- Style: always `strokeWidth={1.5}` for premium thin look

## Code style
- TypeScript strict mode
- Functional components with hooks
- Server components by default, 'use client' only when needed
- API routes in /app/api/ with proper error handling
- Zod for input validation
- No any types

## Key business context
- Market: 2.17M SMBs in Kazakhstan, 1000-1500 language schools
- Competitors: TrustMe (3000+ clients, leader), OnlineContract (141 clients, failing), Documentolog (enterprise)
- Our edge: vertical specialization + ПЭП-first (no NCALayer) + AI template extraction
- Legal basis: ПЭП legalized July 2024 in KZ, Article 152 Civil Code RK
- Target SOM year 3: 100-225 schools, 60-135M tenge revenue