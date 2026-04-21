# /app directory context

## Page structure
/ → Landing (7 sections)
/auth/login → Login (email + Google)
/auth/register → Register (email + Google)
/auth/callback → OAuth callback handler
/dashboard → Contract list (protected)
/sign/[contractId] → Public signing page (no auth)

## Protected routes
All /dashboard/* routes require auth.
Middleware in middleware.ts handles redirects.

## Signing page rules
/sign/[contractId] is PUBLIC — no auth needed.
This is where clients sign contracts.
Must be mobile-first, trust-building design.
Shows: consent → PDF viewer → OTP or QR → signed.

## Design rules (all pages)
- Inter font, cyrillic subset loaded
- Colors from globals.css (navy, sapphire, ice, etc.)
- lucide-react icons only, strokeWidth={1.5}
- Mobile-first always
- 'use client' only when needed
