import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { authenticateRequest } from '@/lib/supabase/apiAuth'

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    // Only admins can invite
    const db = createServiceClient()
    const { data: callerProfile } = await db
      .from('user_profiles')
      .select('role')
      .eq('id', auth.userId)
      .single()

    if (callerProfile?.role !== 'admin') {
      return Response.json({ error: 'Solo los administradores pueden invitar miembros' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = InviteSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { email, role } = parsed.data

    // Check if user already exists in auth
    const { data: usersData } = await db.auth.admin.listUsers()
    const existingUser = (usersData?.users ?? []).find(u => u.email === email)

    if (existingUser) {
      // Check if already in this org
      const { data: existingProfile } = await db
        .from('user_profiles')
        .select('id, org_id')
        .eq('id', existingUser.id)
        .single()

      if (existingProfile) {
        if (existingProfile.org_id === auth.orgId) {
          return Response.json({ error: 'Este usuario ya es miembro de tu organización' }, { status: 409 })
        }
        // User belongs to another org — current schema only allows 1 org per user
        return Response.json(
          { error: 'Este usuario ya pertenece a otra organización. Actualmente un usuario solo puede pertenecer a una organización.' },
          { status: 409 }
        )
      }

      // User exists in auth but has no profile — add to this org
      const { error: profileError } = await db
        .from('user_profiles')
        .insert({ id: existingUser.id, org_id: auth.orgId, role })

      if (profileError) {
        console.error('invite: failed to create profile', profileError)
        return Response.json({ error: 'Error al crear perfil del usuario' }, { status: 500 })
      }

      // Update their JWT metadata
      await db.auth.admin.updateUserById(existingUser.id, {
        app_metadata: { ...existingUser.app_metadata, org_id: auth.orgId },
      })

      return Response.json({ status: 'added', email })
    }

    // User doesn't exist — send invite via Supabase
    const { error: inviteError } = await db.auth.admin.inviteUserByEmail(email, {
      data: { invited_org_id: auth.orgId, invited_role: role },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/confirm`,
    })

    if (inviteError) {
      console.error('invite: inviteUserByEmail failed', inviteError)
      // Common: email sending not configured
      if (inviteError.message?.includes('email') || inviteError.message?.includes('smtp') || inviteError.message?.includes('SMTP')) {
        return Response.json(
          { error: 'No se pudo enviar la invitación. Verifica que el envío de emails esté configurado en Supabase (Authentication > Email Templates > SMTP).' },
          { status: 500 }
        )
      }
      return Response.json({ error: inviteError.message ?? 'Error al enviar invitación' }, { status: 500 })
    }

    return Response.json({ status: 'invited', email })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('POST /api/org/invite error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
