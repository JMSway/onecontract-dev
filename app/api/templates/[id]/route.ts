import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateTemplatesCache } from '@/lib/db'
import type { TemplateField } from '@/lib/types'

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.org_id) return null
  return profile as { org_id: string; role: string }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [templateRes, countRes] = await Promise.all([
    supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .maybeSingle(),
    supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', id)
      .eq('org_id', profile.org_id),
  ])

  if (!templateRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    template: templateRes.data,
    contractCount: countRes.count ?? 0,
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can edit templates' }, { status: 403 })
  }

  const { id } = await params

  let body: { name?: string; description?: string; fields?: TemplateField[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, description, fields } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!Array.isArray(fields)) return NextResponse.json({ error: 'Fields must be array' }, { status: 400 })

  const { data, error } = await supabase
    .from('templates')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      fields,
    })
    .eq('id', id)
    .eq('org_id', profile.org_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  invalidateTemplatesCache(profile.org_id)
  return NextResponse.json({ template: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can delete templates' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
    .eq('org_id', profile.org_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  invalidateTemplatesCache(profile.org_id)
  return NextResponse.json({ success: true })
}
