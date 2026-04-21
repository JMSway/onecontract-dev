import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const redirectTo = NextResponse.redirect(`${origin}${next}`)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectTo.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const loginUrl = new URL('/auth/login', origin)
      loginUrl.searchParams.set('error', 'auth')
      return NextResponse.redirect(loginUrl)
    }

    if (session?.user) {
      try {
        await supabase.from('users').upsert(
          {
            id: session.user.id,
            email: session.user.email!,
            full_name:
              (session.user.user_metadata?.full_name as string | undefined) ??
              (session.user.user_metadata?.name as string | undefined) ??
              null,
            role: 'owner',
          },
          { onConflict: 'id', ignoreDuplicates: true }
        )
      } catch (e) {
        console.error('[auth/callback] upsert users:', e)
      }
    }
  }

  return redirectTo
}
