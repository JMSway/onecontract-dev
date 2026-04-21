# Supabase context for OneContract

## Project
URL: https://zideehxygpnehkjeeqzr.supabase.co
Project ID: zideehxygpnehkjeeqzr

## Auth providers configured
- Email/Password: enabled
- Google OAuth: enabled (Client ID: 781687572263-...)

## Tables (to be created)
organizations, users, templates, contracts,
signatures, audit_log
See full schema in main CLAUDE.md

## RLS policy pattern
Every table MUST have RLS enabled.
Users can only see rows where org_id = their org_id.
Pattern:
  CREATE POLICY "org_isolation" ON table_name
  FOR ALL USING (
    org_id = (
      SELECT org_id FROM users
      WHERE id = auth.uid()
    )
  );

## Migrations location
/supabase/migrations/

## Important rules
- NEVER disable RLS on any table
- NEVER use service_role key in frontend code
- Always use anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Service role key only in server-side API routes
