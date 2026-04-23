import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/supabase/apiAuth'
import { createServiceClient } from '@/infrastructure/db/supabase'
import { getResend, EMAIL_FROM } from '@/infrastructure/email/resendClient'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  try {
    const auth = await authenticateRequest()
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

    const { id: accountId, emailId } = await params
    const db = createServiceClient()

    // Fetch the failed email
    const { data: sentEmail, error: fetchError } = await db
      .from('sent_emails')
      .select('*')
      .eq('id', emailId)
      .eq('account_id', accountId)
      .eq('org_id', auth.orgId)
      .eq('status', 'failed')
      .single()

    if (fetchError || !sentEmail) {
      return Response.json({ error: 'Failed email not found' }, { status: 404 })
    }

    // Update status back to pending and increment retry_count
    await db
      .from('sent_emails')
      .update({
        status: 'pending',
        retry_count: (sentEmail.retry_count ?? 0) + 1,
        error_message: null,
      })
      .eq('id', emailId)

    // Retry sending via Resend
    const { data: resendData, error: resendError } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: sentEmail.to_email,
      subject: sentEmail.subject,
      text: sentEmail.body,
    })

    if (resendError || !resendData) {
      await db
        .from('sent_emails')
        .update({
          status: 'failed',
          error_message: resendError?.message ?? 'Unknown error',
        })
        .eq('id', emailId)

      return Response.json(
        { error: resendError?.message ?? 'Failed to send email' },
        { status: 502 }
      )
    }

    // Success
    await db
      .from('sent_emails')
      .update({
        status: 'sent',
        resend_id: resendData.id,
        sent_at: new Date().toISOString(),
      })
      .eq('id', emailId)

    // Log timeline event
    await db.from('account_events').insert({
      account_id: accountId,
      source: 'manual',
      event_type: 'email',
      title: sentEmail.subject,
      description: `Email reenviado a ${sentEmail.to_email} (intento #${(sentEmail.retry_count ?? 0) + 1}).`,
      sentiment: 'neutral',
      metadata: {
        emailType: sentEmail.email_type,
        recipient: sentEmail.to_email,
        action: 'retry',
        sentEmailId: emailId,
        retryCount: (sentEmail.retry_count ?? 0) + 1,
      },
      occurred_at: new Date().toISOString(),
    })

    return Response.json({ success: true, sentEmailId: emailId })
  } catch (error) {
    console.error('POST /api/accounts/[id]/send-email/[emailId]/retry error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
