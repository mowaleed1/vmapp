-- Migration: 006_email_webhooks
-- Description: Trigger a webhook to the Next.js API route when a ticket is created or updated.

-- Enable pg_net extension for HTTP requests if not already enabled
create extension if not exists pg_net with schema extensions;

-- Create the webhook function
create or replace function public.notify_ticket_event()
returns trigger as $$
declare
  webhook_url text;
begin
  -- Retrieve the NEXT_PUBLIC_SITE_URL or default to localhost for development
  -- For production, replace 'http://localhost:3000' with your actual Vercel domain URL
  webhook_url := 'http://localhost:3000/api/notify/ticket-event';
  
  -- Use pg_net to make an asynchronous POST request
  perform net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'type', TG_OP,
        'record', row_to_json(NEW),
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
      )::jsonb
  );

  return new;
end;
$$ language plpgsql security definer;

-- Attach the trigger to the tickets table
create trigger on_ticket_change_notify
  after insert or update on public.tickets
  for each row execute procedure public.notify_ticket_event();
