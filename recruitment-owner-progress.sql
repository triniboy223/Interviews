-- Applied to the configured project on 2026-11-18. Owners can read their own progress; admin-only writes are unchanged.
create policy owner_read_recruitment_milestones on public.recruitment_milestones for select to authenticated
using (public.access_flag('active') and exists (select 1 from public.interviews i where i.id=recruitment_milestones.interview_id and i.owner_id=(select auth.uid())));
