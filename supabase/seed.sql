-- ============================================================
-- PULSO — Demo seed data
-- Run after: npx supabase db push
-- ============================================================

-- 1. Organization
INSERT INTO organizations (id, name, slug, plan) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acme CS Team', 'acme', 'growth')
ON CONFLICT (id) DO NOTHING;

-- 2. Accounts (10 cuentas con datos variados)
INSERT INTO accounts (id, org_id, name, domain, arr, mrr, tier, renewal_date, health_score, health_trend, risk_level) VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'TechCorp Solutions', 'techcorp.io', 120000, 10000, 'enterprise', '2026-07-15', 82, 'improving', 'low'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'DataFlow Inc', 'dataflow.com', 84000, 7000, 'growth', '2026-05-30', 61, 'stable', 'medium'),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'CloudBase', 'cloudbase.dev', 48000, 4000, 'growth', '2026-06-10', 38, 'declining', 'high'),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'NexaRetail', 'nexaretail.co', 240000, 20000, 'enterprise', '2026-09-01', 90, 'improving', 'low'),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'FinTrack Pro', 'fintrack.pro', 36000, 3000, 'starter', '2026-05-15', 22, 'declining', 'critical'),
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Opus Media', 'opusmedia.net', 60000, 5000, 'growth', '2026-08-20', 74, 'stable', 'medium'),
  ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Stackwise', 'stackwise.io', 96000, 8000, 'enterprise', '2026-10-05', 88, 'improving', 'low'),
  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Meridian Labs', 'meridian.ai', 18000, 1500, 'starter', '2026-05-01', 45, 'declining', 'high'),
  ('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Pulsewave', 'pulsewave.co', 72000, 6000, 'growth', '2026-07-30', 68, 'stable', 'medium'),
  ('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Orbis Platform', 'orbis.io', 180000, 15000, 'enterprise', '2026-11-15', 55, 'declining', 'high')
ON CONFLICT (id) DO NOTHING;

-- 3. Contacts
INSERT INTO contacts (id, account_id, name, email, role, is_champion, is_decision_maker, engagement_score) VALUES
  -- TechCorp
  ('c0000001-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ana Martínez', 'ana@techcorp.io', 'VP Engineering', true, false, 88),
  ('c0000001-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Roberto Silva', 'roberto@techcorp.io', 'CTO', false, true, 72),
  -- DataFlow
  ('c0000002-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Carla Vega', 'carla@dataflow.com', 'Product Manager', true, false, 65),
  ('c0000002-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Miguel Torres', 'miguel@dataflow.com', 'CEO', false, true, 40),
  -- CloudBase
  ('c0000003-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'Luis Herrera', 'luis@cloudbase.dev', 'Engineering Lead', true, true, 30),
  -- NexaRetail
  ('c0000004-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'Sofía Ruiz', 'sofia@nexaretail.co', 'Head of Technology', true, false, 92),
  ('c0000004-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'Diego Morales', 'diego@nexaretail.co', 'CFO', false, true, 78),
  -- FinTrack
  ('c0000005-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'Patricia Núñez', 'patricia@fintrack.pro', 'Founder', true, true, 18),
  -- Orbis
  ('c0000010-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010', 'Andrés Castro', 'andres@orbis.io', 'VP Operations', true, false, 55),
  ('c0000010-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000010', 'Elena Fuentes', 'elena@orbis.io', 'CTO', false, true, 48)
ON CONFLICT (id) DO NOTHING;

-- 4. Account events
INSERT INTO account_events (id, account_id, type, source, title, description, sentiment, occurred_at) VALUES
  -- TechCorp (saludable)
  ('e0000001-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'meeting', 'hubspot', 'QBR Q1 2026', 'Revisión trimestral exitosa. NPS 9/10. Interesan en módulo avanzado.', 'positive', NOW() - INTERVAL '5 days'),
  ('e0000001-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'nps', 'manual', 'NPS Survey Q1', 'Score: 9', 'positive', NOW() - INTERVAL '10 days'),
  ('e0000001-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'support_ticket', 'intercom', 'Consulta API rate limits', 'Consulta técnica resuelta en 2h.', 'neutral', NOW() - INTERVAL '15 days'),

  -- CloudBase (en riesgo)
  ('e0000003-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'support_ticket', 'intercom', 'Fallo en exportación de datos', 'Reportan que las exportaciones CSV fallan desde hace 3 días.', 'negative', NOW() - INTERVAL '2 days'),
  ('e0000003-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'support_ticket', 'intercom', 'Integración con Salesforce caída', 'La sincronización automática dejó de funcionar.', 'negative', NOW() - INTERVAL '7 days'),
  ('e0000003-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'email', 'hubspot', 'Sin respuesta a follow-up', 'No han respondido los últimos 2 correos de check-in.', 'negative', NOW() - INTERVAL '14 days'),

  -- FinTrack (crítico)
  ('e0000005-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'support_ticket', 'intercom', 'Solicitud de cancelación', 'Patricia indicó que evaluarán no renovar el contrato.', 'negative', NOW() - INTERVAL '3 days'),
  ('e0000005-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'nps', 'manual', 'NPS Survey Q1', 'Score: 3 — muy insatisfecho con tiempo de respuesta.', 'negative', NOW() - INTERVAL '20 days'),
  ('e0000005-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 'meeting', 'hubspot', 'Llamada de rescate', 'Reunión de emergencia para entender puntos de fricción.', 'neutral', NOW() - INTERVAL '1 day'),

  -- NexaRetail (excelente)
  ('e0000004-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'meeting', 'hubspot', 'Planning expansión Q2', 'Quieren licencias adicionales para 3 equipos nuevos.', 'positive', NOW() - INTERVAL '3 days'),
  ('e0000004-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'nps', 'manual', 'NPS Survey Q1', 'Score: 10 — promotores activos.', 'positive', NOW() - INTERVAL '8 days'),

  -- DataFlow
  ('e0000002-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'email', 'hubspot', 'Check-in mensual', 'Respuesta positiva. Sin bloqueos por el momento.', 'neutral', NOW() - INTERVAL '6 days'),
  ('e0000002-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'support_ticket', 'intercom', 'Pregunta sobre permisos', 'Consulta sobre roles de usuario resuelta.', 'neutral', NOW() - INTERVAL '12 days'),

  -- Orbis (declining)
  ('e0000010-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010', 'support_ticket', 'intercom', 'Performance degradada', 'Reportan lentitud en dashboards con mucho volumen.', 'negative', NOW() - INTERVAL '4 days'),
  ('e0000010-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000010', 'meeting', 'hubspot', 'Revisión de contrato', 'Quieren renegociar precio. Mencionaron alternativas.', 'negative', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Health score history
INSERT INTO health_score_history (account_id, score, signals, calculated_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 82, '{"productUsageScore":85,"supportHealthScore":90,"engagementScore":80,"npsScore":90,"paymentScore":100,"stakeholderScore":70}', NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000001', 76, '{"productUsageScore":78,"supportHealthScore":88,"engagementScore":72,"npsScore":85,"paymentScore":100,"stakeholderScore":65}', NOW() - INTERVAL '8 days'),
  ('a0000000-0000-0000-0000-000000000003', 38, '{"productUsageScore":40,"supportHealthScore":20,"engagementScore":30,"npsScore":null,"paymentScore":90,"stakeholderScore":25}', NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000003', 52, '{"productUsageScore":55,"supportHealthScore":50,"engagementScore":45,"npsScore":null,"paymentScore":90,"stakeholderScore":40}', NOW() - INTERVAL '8 days'),
  ('a0000000-0000-0000-0000-000000000005', 22, '{"productUsageScore":15,"supportHealthScore":10,"engagementScore":20,"npsScore":30,"paymentScore":80,"stakeholderScore":10}', NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000004', 90, '{"productUsageScore":95,"supportHealthScore":95,"engagementScore":92,"npsScore":100,"paymentScore":100,"stakeholderScore":85}', NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000010', 55, '{"productUsageScore":60,"supportHealthScore":40,"engagementScore":50,"npsScore":55,"paymentScore":90,"stakeholderScore":45}', NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000010', 68, '{"productUsageScore":72,"supportHealthScore":65,"engagementScore":62,"npsScore":65,"paymentScore":90,"stakeholderScore":55}', NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;
