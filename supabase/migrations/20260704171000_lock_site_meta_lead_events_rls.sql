create policy "No client access to site meta lead events"
on site_autopilot.demo_lead_meta_events
for all
to anon, authenticated
using (false)
with check (false);
