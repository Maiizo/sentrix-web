# Database (Supabase / PostgreSQL)

Schema from `docs/sentrix-architecture.md` section 7, as plain SQL.

| File | Purpose |
|---|---|
| `migrations/20261014000000_initial_schema.sql` | Tables, enums, indexes, `updated_at` triggers, RLS policies, Realtime |
| `seed.sql` | **Dev only.** One fake device (`AABBCCDDEEFF` / PIN `123456`) for testing |

## Apply it

1. Create a Supabase project (use a **dev** project, not production).
2. Open **SQL Editor** → paste `migrations/20261014000000_initial_schema.sql` → **Run**.
3. Optional, dev only: run `seed.sql` the same way.

New schema changes go in a **new** file in `migrations/` (e.g. `20261020000000_add_x.sql`).
Don't edit a migration that has already been applied.

## Things to know

- **Defaults are in the database.** Go/Python can `INSERT` without setting `id`, `created_at` or `updated_at`.
- **MAC** = 12 uppercase hex chars, no colons. **PIN** = 6 digits. The database rejects anything else.
- **Who can read what.** The browser (`authenticated`) can only `SELECT` rows belonging to its own groups. It
  cannot write anything: all writes go through the Go API. Go and Python must connect with a privileged role
  (the Supabase `postgres` connection string or the `service_role` key), which bypasses RLS.
- **`devices.pin_code` is readable by the device's owner** through the Supabase client. If you don't want that,
  have the frontend read devices via the Go API instead.
- **Realtime** is enabled for `telemetry` and `alerts` by the migration.
