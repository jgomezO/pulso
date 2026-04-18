import { PLAN_TEMPLATES } from '@/lib/plans/templates'

export async function GET() {
  return Response.json({ templates: PLAN_TEMPLATES })
}
