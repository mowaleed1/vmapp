-- Seed default SLA policies (used for reference; app calculates breach_at inline)
INSERT INTO sla_policies (name, priority, response_time_minutes, resolution_time_minutes)
VALUES
  ('Critical SLA',  'critical', 30,   240),
  ('High SLA',      'high',     60,   480),
  ('Medium SLA',    'medium',   240,  1440),
  ('Low SLA',       'low',      480,  4320)
ON CONFLICT DO NOTHING;

-- Backfill sla_breach_at for existing tickets that don't have one
UPDATE tickets
SET sla_breach_at =
  CASE priority
    WHEN 'critical' THEN created_at + INTERVAL '4 hours'
    WHEN 'high'     THEN created_at + INTERVAL '8 hours'
    WHEN 'medium'   THEN created_at + INTERVAL '24 hours'
    WHEN 'low'      THEN created_at + INTERVAL '72 hours'
    ELSE                 created_at + INTERVAL '24 hours'
  END
WHERE sla_breach_at IS NULL;
