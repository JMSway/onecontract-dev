# /lib directory context

## Files
- supabase/client.ts — browser Supabase client (createBrowserClient)
- supabase/server.ts — server Supabase client (createServerClient + cookies)
- supabase/middleware.ts — session refresh + redirect logic
- supabase-auth.ts — auth functions (Google OAuth, email sign in/up)
- pdf.ts — PDF generation with pdf-lib
- sms.ts — SMS via Mobizon.kz API
- sigex.ts — SIGEX API (eGov QR signing)
- hash.ts — SHA-256 for signed PDFs
- types.ts — shared TypeScript types

## Auth functions available
signInWithGoogle() — OAuth redirect to /auth/callback
signInWithEmail(email, password) — password sign in
signUpWithEmail(email, password) — new account
Callback route: /app/auth/callback/route.ts

## Rules
- No hardcoded API keys ever
- All keys from process.env
- Use lib/supabase/client.ts in 'use client' components
- Use lib/supabase/server.ts in Server Components and API routes
- SMS and SIGEX not implemented yet (phase 2)
