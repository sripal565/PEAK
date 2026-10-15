# Supabase setup and schema deployment

Schema changes live in `supabase/migrations/` and are deployed by Supabase's
built-in GitHub integration when changes reach `main`. No GitHub Actions
deployment workflow or GitHub database secrets are needed for this route.

The initial migration creates only the current app's `public.profiles` table,
its user ownership relationship, input revision constraint, and read access
policy. Authenticated clients can read their own profile. Writes go through the
Fastify API, which validates input, checks the founder's identity, and performs
compare-and-swap updates. Later app features will add their own migrations.

## One-time setup

1. Commit and push this directory to `https://github.com/sripal565/PEAK`.
2. Create a new Supabase project. Save the database password locally. Do not
   create the profiles table manually or run the migration in SQL Editor: the
   integration needs to apply it and record its migration history.
3. In Supabase, open **Project Settings → Integrations → GitHub**. Authorize
   Supabase for `sripal565/PEAK` and select that repository.
4. Set the working directory to `.` (the parent of `supabase/`), select `main`
   as the production branch, and enable **Deploy to production**. Enable the
   integration. Preview branches are optional and not needed for this pilot.
5. Inspect the integration deployment logs. Verify that
   `20261015000000_create_profiles.sql` was applied and that the Table Editor
   shows `public.profiles` with Row Level Security enabled. If there is no
   initial deployment, push a README change to `main` to trigger a commit.
   Do not run the SQL manually as a workaround.
6. Create the founder user in **Authentication → Users** and copy its UUID.
   Configure email OTP as described below, then fill the environment files.

`project_id = "peak"` is a local CLI identifier, not a placeholder to replace
with a hosted project reference. GitHub's integration connects the hosted
project. A `[remotes.main]` block is deliberately absent: this setup deploys
schema migrations without overwriting hosted Auth/API configuration.

## Email-code sign-in

Enable the Email provider. In **Authentication → Email Templates → Magic Link**,
use this email body:

```html
<h2>Your PEAK sign-in code</h2>
<p>{{ .Token }}</p>
```

The app prevents automatic user creation, so create your founder account before
requesting a code. Disable public signups in the hosted Auth settings for this
private pilot. The built-in email service only sends to organization team
addresses and has low rate limits. Use your Supabase organization member email
for initial testing, or configure custom SMTP for another address.

Hosted Auth settings are configured in the dashboard for now. Adding a template
file alone would not deploy those settings to production; explicit remote
configuration would be needed to manage them through this repository later.

## App environment

Copy the example files only if the destination does not already exist:

```sh
cp -n .env.example .env
cp -n apps/mobile/.env.example apps/mobile/.env
```

In the root `.env`, fill `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`DATABASE_URL`, `FOUNDER_USER_ID`, and `PORT=8080`. Use the project's Connect
dialog to obtain its URL, publishable key, and Session pooler connection string.
Replace the connection string's password placeholder; URL-encode reserved
characters in that password. Keep the database connection string server-side.

In `apps/mobile/.env`, fill `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `EXPO_PUBLIC_API_URL`.
Use `http://localhost:8080` for the iOS simulator, or your Mac's LAN address
on the same network for a physical iPhone. Never put a database password or
Supabase secret key in an `EXPO_PUBLIC_` variable.

Restart the API and Expo after changing environment files. Sign in and save
goals with **Save and sync goals**. A profile row appearing in Supabase verifies
the account/API/database path; `/health` alone does not test database access.

## Future schema changes

1. Create a new timestamped migration, for example:
   `supabase/migrations/20261016000000_add_goal_records.sql`.
   With a locally installed CLI, `supabase migration new add_goal_records`
   creates the filename for you.
2. Add only the incremental SQL change, including ownership policies/grants
   for any new private table. Never rewrite or rename an applied migration.
3. Test on a disposable local database or preview project and review the diff.
4. Commit and merge to `main`; inspect the Supabase deployment result.

The integration applies new migration files; changing a previously applied file
does not rerun it. It does not directly deploy ORM definitions or files under
`supabase/schemas/`: generate and commit migrations from any declarative schema
workflow first. Use only one production migration deployer.

## Optional local database testing

Local CLI database testing needs Docker and the Supabase CLI. No dependency
installation is required just to connect GitHub in the dashboard.
`config.toml` selects Postgres 17 for local use; match `db.major_version` to the
hosted project's version before comparing local and hosted schemas.

```sh
supabase start
supabase db reset --local
supabase db lint --local
```

`db reset --local` clears the disposable local database. Do not use a linked or
remote reset to fix migration failures. A failed initial deployment should be
investigated using its logs before changing migration history.

## References

- [GitHub integration and production deployment](https://supabase.com/docs/guides/deployment/branching/github-integration)
- [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [CLI configuration](https://supabase.com/docs/guides/cli/config)
- [Email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Email delivery restrictions](https://supabase.com/docs/guides/auth/auth-smtp)
