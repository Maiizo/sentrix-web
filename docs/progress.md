# Sentrix: Progress & Next Steps

Last updated: 2026-10-14. Follows the build order in
[`sentrix-architecture.md`](sentrix-architecture.md) section 12.

## Done

### Frontend (`frontend/`)
- Pages: landing, login, signup, onboarding, dashboard, alerts, analytics, settings.
- Supabase Auth client prepared (`app/lib/supabase-browser.ts`); works with no env vars set.

### CI (`.github/workflows/frontend-ci.yml`), merged in PR #1
- Runs on every push to `main` and every pull request.
- Steps: `npm ci` → `npm run lint` → `npm run build` in `frontend/`, Node 24.
- Uses no secrets. Passing on `main`.
- Fixed `frontend/package-lock.json` so `npm ci` works on GitHub's newer npm.

### Database schema (`supabase/`), branch `feat/database-schema`, **not pushed/merged yet**
- `migrations/20261014000000_initial_schema.sql`: all tables from architecture section 7, enums,
  indexes, `updated_at` triggers, signup-to-profile trigger, RLS read policies, Realtime for
  `telemetry` and `alerts`. Includes `UNIQUE(device_id, timestamp)` on `prediction_bounds` and
  the `push_subscriptions` table.
- `seed.sql`: one fake dev device (`AABBCCDDEEFF` / `123456`).
- `README.md`: how to apply it.
- Tested on a local Postgres with a stand-in for Supabase's `auth` schema (constraints, upsert,
  triggers, RLS isolation, cascade deletes, the Day 8 atomic update).

## Not done yet

| Area | State |
|---|---|
| Go backend (`backend/`) | Empty |
| Python ML service (`ml/`) | Empty |
| Firmware (`firmware/`) | Empty (IoT team) |
| MQTT broker | Not created |
| Frontend ↔ real data | Dashboard not wired to Supabase tables; no Recharts; group/sensor routes missing |
| CI for Go and Python | None (nothing to check yet) |

## Next steps (in order)

1. **Push and merge the schema branch.**
   `git push -u origin feat/database-schema`, open a PR, wait for CI, merge.
2. **Apply the migration to a Supabase *dev* project** (SQL Editor → paste → Run), then run `seed.sql`.
   Not yet tried on real Supabase: confirm the signup trigger and Realtime work there.
3. **Create the MQTT broker** (HiveMQ Cloud free cluster) and send the architecture section 5.1 table
   (host, port, credentials, topics, QoS) to the IoT team.
4. **Go backend:** `go mod init`, MQTT subscriber that inserts into `telemetry`
   (architecture 8.1), then the Day 8 calibration check (8.2). Test with `mosquitto_pub` / MQTTX.
   Add `CALIBRATION_MINUTES` so you can test in 5 minutes instead of 7 days.
5. **Python service:** `ml/requirements.txt`, FastAPI `POST /api/calibrate` (8.4), Auto-ARIMA fit and
   bulk upsert into `prediction_bounds` (8.5). Query Postgres directly, not the Supabase client
   (1000-row limit, gotcha #2). Test with a generated sine-wave dataset.
6. **Add CI for Go and Python** once those folders have real code
   (`go test` / `go build`; `pip install` / `pytest`).
7. **Go REST API** (architecture 5.5) with Supabase JWT checks and ownership checks.
8. **Frontend:** wire the dashboard to real data; add Recharts; add `/dashboard/[groupName]` and
   `/dashboard/[groupName]/[sensorId]`; BLE onboarding modal (can be mocked before firmware exists);
   Realtime subscriptions.
9. **Alerts in Go** (bounds check, 3 consecutive breaches before alerting, gotcha #7), the daily
   bounds refresh job, then Web Push and the alert feedback UI.
10. **Real hardware integration** with the IoT team against the MQTT contract.

## Decisions to settle with the team
- Telemetry payload: single reading vs batched (architecture 5.4).
- BLE payload size: does it need chunking (MTU limit)?
- ML approach: Auto-ARIMA (architecture docs) vs Isolation Forest / edge inference (sprint doc).
- Whether the frontend reads devices through Supabase directly or only via the Go API
  (`devices.pin_code` is visible to the owner via direct reads).
- Optional: require CI to pass before merging (GitHub → Settings → Branches / Rules → `main` →
  "Require status checks" → "Lint and build").
