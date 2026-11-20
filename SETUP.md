# Guhuza interview website

## November 18 additions

- Every signed-in, active user can use Import interviews. Paste the two-column or plain-text format, or upload TXT, Markdown, HTML or Word DOCX notes. Multiple interviews are supported, up to 100 per batch. No interview is saved before preview and selection.
- Enter the original interview date for every selected record. A bulk date control can fill a batch, and each record can be changed individually. Missing dates are never silently replaced with the import date.
- Ordinary users import into their own account. Administrators can assign imports to a registered person. The source interviewer name is retained separately. Exact repeated imports are skipped and possible candidate/job/date matches are flagged for review. Failed records remain retryable.
- Home, Saved interviews and Interview status are personal for every user, including administrators. Admin contains all team interviews, interviewer attribution, team totals and registered-person profiles. Non-admins explicitly granted View all or Edit all have a separate Team interviews button; their personal pages remain personal.
- Hover, keyboard-focus or tap a period card to see the team's top three interviewers for that period. Only aggregate names and counts are exposed to ordinary signed-in users. Personal card counts remain personal.
- Registered people includes weekly, monthly, yearly and all-time interview totals. Open a name for jobs, interviews, profile editing, reset-email controls and access commands. Permission checkboxes do not save automatically; use Save permissions.
- Remove access keeps the profile and history and blocks new database requests. Restore access reverses it. Delete workspace profile is a separate confirmed action: it deletes the workspace profile, blocks workspace access, and retains interview history and the Supabase authentication identity. The email therefore remains registered. Another admin must manage your own access.
- Backlog schema support is in `backlog-admin.sql` and the access-control extension is in `account-access-and-scopes.sql`. They were applied to the configured project. Existing users were not disabled or deleted during verification; temporary test changes were rolled back.
- Website files also include `backlog-parser.js`, `interview-extras.js` and `interview-extras.css`. Upload these with the other site assets. Do not put SQL, candidate backups or secret keys in the public website.

This is a GitHub Pages compatible update of your supplied interview tool. It includes email and password registration, remembered sessions, interviewer autofill, shared interview storage, searchable jobs, a guided tutorial, an Admin tab, registered accounts, and permissions. The original notes, assessment and follow-up tools remain.

## What you need to activate

GitHub Pages serves the website files. Supabase provides accounts and the private database. Google Apps Script copies database records to Google Sheets on a schedule. No live project, account, spreadsheet or GitHub repository has been configured by this package. There is no default administrator password.

1. Create a Supabase project at https://supabase.com. Open its SQL Editor and run `database.sql` once in a new project. Do not run it on a database that already has these tables.
2. In Supabase Authentication, enable email and password accounts and email confirmation. Set the Site URL and allowed redirect URL to your exact GitHub Pages URL, including the repository path and trailing slash. Set up production email delivery before inviting students.
3. Edit `config.js`. Enter your project URL and its public anon key or publishable key. Never enter the service role key in this file or anywhere on GitHub.
4. Create a GitHub repository and upload `index.html`, `auth-ui.js`, `legacy.js`, `portal.js`, `workspace.js`, `workspace.css`, `config.js`, and `.nojekyll` at its root. Keep the JSON interview backup, SQL, setup instructions and Apps Script outside the published files. In repository Settings, Pages, choose Deploy from a branch, select your branch and root folder, and save. Keep all website files together when opening the folder locally. The separately supplied `Guhuza-Interview-Updated.html` embeds the local scripts for opening as one file; its embedded configuration must also be filled before live registration is available.
5. Open the Pages address, register your account with your full name, confirm the email and sign in. The email address serves as the username.
6. In Supabase SQL Editor, promote your own account, substituting your actual email:

```sql
update public.profiles set is_admin=true
where lower(email)=lower('YOUR-EMAIL-HERE');
```

7. Sign out and sign back in. Admin appears to the right of the three existing tabs. Richelle should register her own account. Find it under Admin, Registered people & permissions, and turn on Admin panel. No passwords are shared. Admin access includes reading, editing and deleting all interviews and managing permissions. View all permits reading everyone's records. Edit all permits editing and deleting everyone's records. Ordinary members can read, edit and delete only their own interviews. The database enforces these rules. An admin cannot change their own permissions through the panel.

## Import the supplied backup privately

After becoming an admin, use the existing Restore backup control to choose `Guhuza-interviews-2026-11-16.json` directly from your computer. Do not upload that JSON to the GitHub repository. Wait until the shared database message confirms saving, then refresh and verify the count. Duplicate interview IDs are skipped. Historical interviewer names are kept. Imported records belong to the importing admin, so historical interviewers do not automatically get ownership. Admins can view them all; give a person View all if they need access to the archive.

Job search uses the shared jobs table and returns at most eight results after two characters. Saving an interview with a new job ID and position creates a reusable job. The same job ID keeps its original title. Changing a job title globally currently requires a database edit by the owner.

## Connect Google Sheets

1. Create a private Google spreadsheet and copy its ID from its URL.
2. Open Extensions, Apps Script. Paste `Google-Sheets-Sync.gs` into the editor.
3. Under Project Settings, Script Properties, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SPREADSHEET_ID`. The service role key is a private backend credential with broad database access. Store it only in this private script project. Do not put it in website files, sheet cells or GitHub.
4. Run `syncInterviews` and authorize access. Confirm the Interviews tab appears with records.
5. Under Triggers, add a time-driven trigger for `syncInterviews`, every five minutes. Enable failure notifications. Check Executions if a run fails. `LAST_SUCCESSFUL_SYNC` in Script Properties records the last successful run.

The sheet updates existing rows by interview ID and retains archived rows if an interview is later deleted from the app. Each row includes core fields and the complete interview JSON, including assessment and follow-up details. This is an automatic scheduled copy, not an immediate transaction with Google Sheets. Larger records exceeding a Sheets cell limit raise an error rather than silently truncating information. For a large archive, quotas and runtime may require a more scalable incremental integration.

## Everyday use and limitations

- Sessions persist on the same browser until sign-out or session expiry. Use Sign out on shared computers.
- Drafts and per-tab preferences stay only in the open tab. Saved interviews are shared through the database. Close the tab only after saving. There is no offline save support.
- A visible database status distinguishes pending or failed writes from completed saves. Retry failed saves or download a backup before leaving. Backup files contain private candidate information.
- The Admin people grouping is by interviewer, with candidate names searchable and each interview opening its complete notes.
- Use Refresh interviews to fetch other people's latest changes. There is no live collaboration or edit-conflict resolution; the last saved update wins.
- Permissions take effect in database requests immediately. After changing someone's permissions, have them sign out and back in to update their interface. Already viewed information cannot be recalled from a person's browser.
- Home shows personal week, month, year and overall interview counts, using Monday as the start of the week and the browser's time zone. Counts are based on record ownership and original save date, not last edit date. Admin-imported historical interviews remain owned by the importing account.
- The gear icon at the top right opens My profile, Settings and Sign out. Clicking the Guhuza name returns Home. Form preferences and backup controls are inside Settings.
- Session loading has a 15-second deadline and a visible retry screen. A separate startup watchdog also handles blocked library downloads. Retrying reloads the page without clearing saved credentials. The pinned Supabase browser client is version 2.119.0, and website asset URLs are versioned together to avoid stale mixed scripts. If an older interview tab holds a stale session operation, close that old tab and reload the latest site.
- My profile lets you view your account details and edit your full name. Settings lets you request a password reset or an email change requiring confirmation. Forgot password and Resend confirmation email are also available at login. A password recovery link opens a dedicated new-password and confirmation form.
- Existing installations must run `account-update.sql` once to add profile editing and email synchronization. Do not rerun `database.sql` on an existing installation. This update was applied and its two readiness checks returned true in the supplied project on November 16, 2026.
- Account deletion and an admin invitation screen are not included. Use the Supabase account dashboard for those actions.
- The guided tutorial highlights the actual sections, scrolls them into view and explains Candidate, job search, Location and commute, Employment preferences, Interest and next steps, deeper questions, saving, saved notes, status and profile settings. You can interact with the page while it is open. Tutorial exploration stays in your draft and is never automatically saved. Existing browser-dependent speech and local AI capabilities remain browser-dependent.
- Supabase and the pinned browser library are external dependencies. Without configuration or sign-in the page exposes no interview records. The supplied candidate JSON is not embedded.

## Verification before inviting students

JavaScript syntax and automated isolated checks were run during preparation. Live authentication, email delivery, SQL execution, browser layout, permission enforcement against a real project, GitHub deployment and Google authorization still need verification after configuration.

Create two ordinary accounts and one admin. Save an interview as each student. Confirm students only see their own interviews. Grant View all and confirm the account can read but cannot update the other student's interview. Grant Admin and confirm registered accounts and all records appear. Test a failed connection and Retry. Confirm a new job becomes searchable from another account after refreshing. Run Sheets sync twice and verify it updates the same rows without duplicates. Test the tutorial on desktop and mobile before general use.

References: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages , https://supabase.com/docs/guides/database/postgres/row-level-security , https://supabase.com/docs/reference/javascript/auth-signinwithpassword , https://developers.google.com/apps-script/guides/triggers/installable

## Admin redesign and working sessions, November 18
Admin opens to a separate overview, with focused interview, job, interviewer, people and activity views. Daily charts compare the selected last 7, 14 or 30 calendar days, including today, with the preceding matching period. Original interview dates are used for imports. Home shows personal Today/Week/Month/All time totals and a separate weekly top-five leaderboard.

Act as this person is an active-admin-only working session. It uses a separate, non-persistent browser frame, never replaces the admin's stored sign-in, and has a 45-minute workspace limit. Exit impersonation ends its sign-in and marks the audit session closed. Normal target permissions still apply. Profile, job and interview database writes are logged against the initiating admin and the target account; the log stores operation and record IDs, not passwords or candidate-note payloads. Supabase Auth maintains its own authentication logs for account changes. If a browser is closed before Exit, the workspace session expires at its time limit.

The admin-impersonation Edge Function reads its privileged key only from Supabase's server environment. No privileged key belongs in website files. Backend definitions are supplied in admin-impersonation.sql, admin-impersonation-edge.ts and daily-interview-totals.sql for reference. These have already been deployed to the configured project; do not rerun table-creation scripts on the existing database.

## Version 2.3.0 interface update
The supplied Gerrie artwork is used unchanged in the walkthrough and selected guidance/empty states. The walkthrough covers 20 student sections, with two additional admin sections; it explains drafts, immediate-save task updates, original import dates and how to review AI wording. It does not save a practice interview automatically.

My interviews starts with a browser of the signed-in person's own records, with recent/name/date sorting and job folders. A candidate opens only after selection or an explicit Save & view notes. Follow-up supports status/job/list grouping, periods, sorting and existing task updates. The AI wording dialog has an accessible X that closes without applying a suggestion.

Changelog sits between Help & walkthrough and Refresh. It defaults to the newest release, offers an oldest-first view and categories, and contains retrospective version labels based on verified repository dates from November 16 and 18. Those labels are editorial history groupings, not claims that Git tags were created on those dates.

## Version 2.3.2: keep your place on reload
The current workspace section is remembered per signed-in account in this browser tab's session storage. Saved interview selection is restored only after shared data is loaded and ownership/team access is checked again. My interviews job browsing and tracker filters are restored, and Admin remembers its selected section and supported grouping/chart state. Invalid, unavailable or newly restricted destinations fall back to an allowed view. Impersonation frames do not read or write the remembered admin location. This stores navigation state only; unsaved form entries remain drafts in the open page.

## Version 2.4.0: admin analytics
Five focused analytics tabs sit below Overview: Interview activity, Team performance, Jobs and candidate fit, Follow-up progress, and Recruitment funnel. Each supports 7/14/30-day or custom periods, job and interviewer filters, and chart selections that reveal the matching interviews. Counts use original interview dates where available. Comparisons use the immediately preceding matching period. Interview volume does not measure interview quality.

Follow-up timing is recorded by a database trigger from this release onward. Reliable duration starts only for newly created interviews with no tasks already completed. Older/imported interviews retain unknown timing rather than an invented completion date. Reopening a task clears its completion timestamp. Current outstanding task counts remain available for older records.

Admins can expand Recruitment progress within an interview and record actual submission, employer interview, offer and hire dates. Save recruitment progress saves those dates separately from follow-up tasks. Removing a milestone retains a soft-deleted record. Funnel totals show explicitly recorded milestones for the selected interview-date cohort, with no inferred prior stages or assumed unsuccessful outcomes.

The backend definitions are in admin-analytics.sql and have already been applied to the configured Supabase project. Do not rerun the migration there. The two metadata tables allow active-admin reads; writes use the guarded admin RPC or database trigger. No privileged key is included in the browser.

Model, regression and rolled-back database permission tests passed for this release. GitHub Pages deployment succeeded. A signed-in visual check of the new charts remains outstanding because the private browser preview was blocked.

## Version 2.4.1: recruitment progress in My interviews
Admins open a saved interview, update confirmed Recruitment progress milestones and actual dates, then choose Save recruitment progress. The panel opens automatically for admins. My interviews shows the highest confirmed milestone beside each candidate name in recent lists and job folders. No progress recorded means no active milestone exists. People use Refresh to retrieve changes from another session. Their progress is read-only; only active admins can save milestones. The owner-read policy in recruitment-owner-progress.sql has already been applied to the configured project.

## Version 3.0.0: team portal
The main dashboard uses large square team tiles. HR contains the existing interview workspace; each team also supports Training, Projects and Spreadsheets. Portal admins manage memberships and portal roles. Team admins manage only their assigned team's content. Existing accounts were assigned HR to retain access; new registrations start without a team. Review assignments in Dashboard → Admin settings.

Each membership has independent Training, Projects, Spreadsheets and (HR only) Interviews permissions. Team admins can manage all areas of their team. A student must have the area assigned and must complete every required training document before accessing a gated area. Training cannot grant an unassigned area. Training access is included when other areas are assigned so prerequisites remain reachable.

Upload training documents through the Training tile. No training material was supplied with this release and none was invented. Use Training unlock settings on a document to require its acknowledgement before selected areas unlock. Acknowledgements record completion declarations, not verified understanding. New documents use new records so acknowledgements are not silently reused for replacement content. Remove its unlock requirements before archiving a required document. New area access launches Gerrie's introduction; Interviews retains the full in-depth existing guide.

Team admins create projects for a team or a selected team member. Students upload completed work and notes. Submissions remain Submitted for review until a team admin approves them or requests changes. Revised work is another submission. A student sees their own submissions; their team admins can review all submissions in that team. Projects can be closed and reopened.

The team-training and team-projects Supabase buckets are private, with 20 MB per-file limits. Downloads use short-lived links. Memberships, access rules, resource metadata, spreadsheet URLs, training acknowledgements and submissions remain on the server. No training documents, project work or spreadsheet URLs are included in the public source. Google controls access to the actual sheets separately. The provided HR sheet and admin daily checklist were configured on the server.

Backend migrations were applied to the configured Supabase project. Definition/reference scripts remain in the local work folder and must not be rerun there. Database tests use fictional, rolled-back records. Access checks cover team boundaries, locked areas, multiple prerequisites, unassigned areas, private submissions, self-approval prevention and scoped administration. The existing global impersonation capability remains limited to portal admins. New table writes also use its audit trigger.

## Version 3.1.0: Home, roles and management shortcuts
Home opens a person's only team directly; accounts with secondary teams see the team chooser. Square tiles are compact and use consistent SVG line icons. Home and every team include Changelog. The interview sidebar uses Back to HR and Interview overview; the breadcrumb is Home / HR / Interviews.

Each team admin receives a Team admin tile with training, project and spreadsheet management shortcuts, plus Interview admin for HR. Portal admins can open global Admin settings from there. Team admin implies all team areas and team lead abilities. Per-team Select all areas is available in person settings. Selecting areas for an additional team also selects that secondary membership.

Team leads can create, assign, close/reopen and review team projects once their Projects area is unlocked. They can view their team's submissions and roster. They do not receive interview administration, training resource administration or access-management powers. A different lead or admin must review a person's own submission. Portal admin support profiles include Act as this person; the existing server-authorised, audited working session is reused and limited to portal admins.

## Version 3.2.0: co-op lifecycle, work and meetings
Portal admins select a team block or Archived co-ops in Admin settings. Each person shows active/scheduled/expired/removed status and placement dates. The three designated full-time staff accounts were marked full-time at the user's request. Other existing accounts remain active with Dates not set until real dates are entered. No co-op dates have been guessed. Full-time status exempts date-based expiry, not manual suspension.

Workspace access is checked against the database clock in America/Toronto on sign-in and every protected data request. A placement end date is inclusive through 23:59:59; access ends at the following midnight, with daylight-saving changes respected. A scheduled placement cannot enter before its start date. The site shows an access-ended page and blocks data access for expired sessions. Auth identities, profiles, memberships, interviews, submissions and history are retained. Archive membership is derived from placement state, so extensions restore date-based access without moving or deleting records. This is portal authorisation, not deletion of the underlying authentication identity or revocation of Google/Microsoft accounts.

Tasks & projects distinguishes recurring daily/weekly responsibilities from one-off projects. Several people can be assigned independently, or an item can be available to the team. Project due dates and recurring end dates are checked against placements before assignment; warnings require acknowledgement. Daily/weekly task periods use working days, ending at each co-op's placement boundary. Completion is explicitly recorded, not inferred from interview counts. Projects are submitted as files for review; recurring tasks can be marked complete with notes. Only the latest submission for a person/period can be reviewed. Another lead or admin must approve a person's own submission. My work and Team overview include paged history with actual assignment, start, submission and completion timestamps. Supervisors can filter by person.

Gerrie's bell provides current in-app notifications and small corner popups. It refreshes approximately once a minute while signed in, when the window regains focus and after relevant actions. Read and dismissal markers are stored for that user. It is not an email service, operating-system push subscription or a background reminder when the website is closed. Reminders are based on real open work, due dates, pending reviews, required training, placement end dates and meetings beginning soon. No training reminders are invented when no required training is configured.

Meetings are configured on the server from the supplied links. Pre-testing is 10:30–11:00; Testing with Development is 11:00–11:30; other teams' pre-meeting is 11:00–11:30; Sales also has 11:30–12:00; the daily co-op meeting is 12:00–13:00 and optional for Testing. All times are Toronto time. Regular meetings show cancelled on weekends. Team admins can cancel a selected date, restore it or suspend/resume the recurring meeting for their team. These are portal controls; they do not cancel a Microsoft Teams calendar event. Join buttons recheck the current server schedule before opening the link.

Training room access defaults to no grant. Administrators configure a start/end window for a team or an individual. An individual override can allow a timed window, deny access or inherit the team rule. Training room windows can be granted explicitly on any day; they do not create automatic 9 a.m. access. Placement and area-access rules still apply. Microsoft Teams controls its own admission and any links previously copied outside this portal cannot be recalled by hiding a button here.

Meeting URLs and grants are not in the public website source. Backend changes have already been applied to the configured Supabase project. Local work scripts are references and must not be rerun on that project. Database tests use fictional rolled-back records. Coverage includes Toronto/DST cutoffs, archive/extension retention, multi-person warnings, recurring work, notifications, supervisor review, optional meeting labels, weekend cancellation, timed room access and cross-team isolation. Impersonated changes to new work and meeting records are included in admin activity.


## v3.3.0 work scheduling and submission privacy

My work is the default for all roles. Current task occurrences are separate from the 42-day month calendar. Daily reminders have a distinct key per occurrence. Scheduling uses Toronto dates, weekdays chosen by the supervisor, biweekly intervals anchored to the first task week, and selected month weeks for monthly or quarterly work. The Last option means the last selected weekday in a month. Existing weekly tasks without selected days keep their original Monday-to-Friday period. New schedules require explicit day choices.

The team catalogue and calendar return names, descriptions and due dates without completion records or file paths. Existing row policies continue to restrict raw assignments. Completion notes and history are visible to their owner and team admins; team leads cannot read peers’ completed content. Only team admins can download submitted files and CSV reports or review submissions. Uploads remain available to assigned members, with a required completion comment and the existing 20 MB limit. Weekend schedules return no meetings, including the training room.


## v3.4.0 private learning library and section addresses

Training & tools uses the existing Training area permission. The configured Supabase project has the private workbook import: 413 training activities and 183 tool-directory entries, with stable per-team source keys. Seed data, extracted workbook content and migration reference files stay in the local work folder and must never be published to GitHub Pages. The source workbook itself was not changed. Existing Done columns, named progress columns and contact records were not imported. No learning enrolments, progress or assignments were fabricated by the import.

Full path includes active lessons selected by the admin. Condensed starts with Core training and First-week training labels and is independently editable per lesson. Assigning a path snapshots membership into per-person assignments and retains completion history. Later path edits apply when the path is assigned again. New lesson revisions are visible beside older completions; earlier acknowledgement records remain on file. Admins can archive lessons/tools, and history remains stored.

Lesson notes and status are protected by row policies: own records and team admins. Team leads can assign paths but cannot read other people’s learning notes. Certain source tools require an individual portal access grant. The safe catalogue returns a locked summary without links until that grant exists. External services still control their own sign-in and sharing. Source reference links have been transferred, not independently watched or verified for current content/access. Missing links, old sources and lead-confirmation notes remain explicit. Contact-sheet links route to Profile, and Teams links route to Meetings.

Predefined activities populate task/project title and instructions with a server-validated link to the source resource. Supervisors choose the actual schedule and assignees. Learning notes are required; source activities requiring supervisor confirmation wait for a different team admin. New learning writes are included in support-session auditing.

Hash section addresses work on GitHub Pages without server rewrites. URLs contain navigation state and opaque record IDs, not draft searches, candidate names, passwords or sign-in tokens. They are permission checked on restore and do not make team data public. Authentication recovery fragments are handled separately.


## v3.5.0 inline learning and sequential sections

Lessons expand on one Training page. Resources & tools has its own team route and uses the existing Training permission, plus per-tool restricted access where configured. No bulk access expansion was applied. Team admins have a scoped area-access setter for existing non-admin members of their team. They cannot use it to change portal roles or memberships.

Full training is the implicit default unless a team admin has chosen Condensed. Sections follow section_order and the applicable path membership. Each next section requires completed_count * 100 >= previous_section_total * 70, using current-revision completed learning records. Pending confirmations do not count. The same condition protects raw resource reads, catalogue content and completion RPCs. Admin preview remains available. Rates and full team lesson matrices are admin-only; students see their own status.

The workspace RPC returns the team catalogue plus permitted progress in one response. Browser caching is per signed-in user/team, expires after 60 seconds, and is invalidated on writes or Refresh. Inline lesson browsing performs no further fetch. Native resource anchors preserve normal browser behaviour and external-provider access requirements. Spreadsheet links use the existing permitted team resource URLs, retaining gid/range fragments; the original workbook tab IDs were checked using Drive metadata without importing its personal/candidate rows.
