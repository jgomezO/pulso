import { NextRequest } from 'next/server'
import { z } from 'zod'
import { authenticateRequest } from '@/lib/supabase/apiAuth'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { getResend, EMAIL_FROM } from '@/infrastructure/email/resendClient'

const PostBodySchema = z.object({
  contactId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  emailType: z.string().min(1).max(50),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const { id: accountId } = await params
    const body = await request.json()
    const parsed = PostBodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { contactId, subject, body: emailBody, emailType } = parsed.data
    const db = createServiceClient()

    // Verify account belongs to org and fetch contact email
    const [accountRes, contactRes] = await Promise.all([
      db.from('accounts')
        .select('id, name')
        .eq('id', accountId)
        .eq('org_id', auth.orgId)
        .single(),
      db.from('contacts')
        .select('id, name, email')
        .eq('id', contactId)
        .eq('account_id', accountId)
        .single(),
    ])

    if (!accountRes.data) {
      return Response.json({ error: 'Account not found' }, { status: 404 })
    }
    if (!contactRes.data || !contactRes.data.email) {
      return Response.json({ error: 'Contact not found or has no email' }, { status: 404 })
    }

    const toEmail = contactRes.data.email
    const recipientName = contactRes.data.name

    // Insert sent_emails row with status='pending'
    const { data: sentEmail, error: insertError } = await db
      .from('sent_emails')
      .insert({
        org_id: auth.orgId,
        account_id: accountId,
        contact_id: contactId,
        sent_by: auth.userId,
        to_email: toEmail,
        subject,
        body: emailBody,
        email_type: emailType,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError || !sentEmail) {
      console.error('Failed to insert sent_email:', insertError)
      return Response.json({ error: 'Failed to create email record' }, { status: 500 })
    }

    // Send via Resend
    const { data: resendData, error: resendError } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: toEmail,
      subject,
      text: emailBody,
    })

    if (resendError || !resendData) {
      // Update status to failed
      await db
        .from('sent_emails')
        .update({
          status: 'failed',
          error_message: resendError?.message ?? 'Unknown error',
        })
        .eq('id', sentEmail.id)

      console.error('Resend error:', resendError)
      return Response.json(
        { error: resendError?.message ?? 'Failed to send email' },
        { status: 502 }
      )
    }

    // Update status to sent
    await db
      .from('sent_emails')
      .update({
        status: 'sent',
        resend_id: resendData.id,
        sent_at: new Date().toISOString(),
      })
      .eq('id', sentEmail.id)

    // Log timeline event
    await db.from('account_events').insert({
      account_id: accountId,
      source: 'manual',
      event_type: 'email',
      title: subject,
      description: `Email de ${emailType} enviado a ${recipientName} (${toEmail}).`,
      sentiment: 'neutral',
      metadata: {
        emailType,
        recipient: toEmail,
        recipientName,
        action: 'sent',
        sentEmailId: sentEmail.id,
      },
      occurred_at: new Date().toISOString(),
    })

    return Response.json({ success: true, sentEmailId: sentEmail.id })
  } catch (error) {
    console.error('POST /api/accounts/[id]/send-email error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
