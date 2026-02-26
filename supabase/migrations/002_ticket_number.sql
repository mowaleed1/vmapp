-- Add ticket_number column with VM-XXXXXX format
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_number TEXT UNIQUE;

-- Backfill existing tickets with VM-XXXXXX numbers
UPDATE tickets
SET ticket_number = 'VM-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6))
WHERE ticket_number IS NULL;
