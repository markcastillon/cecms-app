# CECMS: Community Evacuation Center Management System

ITE 18 (Applications Development and Emerging Technologies) final project.
A rebuild of the CSC 106 evacuation center system for Barangay Pangabugan, Butuan City, as a
React app with login, a staff dashboard, data analytics and an Android build.

- **Public page:** live center capacity and status, emergency announcements, barangay policies,
  and a volunteer sign-up form. Shows totals only, never names.
- **Staff area (login required):** register families and their members, mark families as returned
  home, edit center capacity and status, post announcements, track relief supplies, review
  volunteer sign-ups.
- **Analytics (emerging technology):** occupancy by center, arrivals over time, age and sex
  breakdown, vulnerable groups, a forecast of when each center will be full, a recommendation of
  where to send new arrivals, and days of food left per center.

It runs right away in **demo mode** (sample data saved in your browser). Connect Supabase to make
it a real multi-user system.

---

## Tech stack

| Part | Tool |
|---|---|
| UI/UX design | Figma (wireframes and prototype: add the link to the documentation) |
| Styling | Tailwind CSS 4 |
| Frontend | React 19, React Router |
| State management | Context API with `useReducer` (`src/context/`) |
| Build tool | Vite |
| BaaS and database | Supabase (Auth, Postgres, Row Level Security, Realtime) |
| Mobile | Capacitor (Android), with the Network plugin for offline detection |
| Emerging tech | Data analytics and visualization (`src/analytics/pipeline.js`, Recharts) |
| Icons | Lucide React |

## Run it on your computer

Install Node.js 20 or newer, open a terminal in this folder, then:

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

- Click **Staff login**. In demo mode the demo account is filled in for you:
  `coordinator@demo.ph` / `demo1234`.
- **Reset demo** (top right of the staff area) puts the sample data back.

## Connect Supabase (real backend)

1. Create a free project at https://supabase.com.
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and click **Run**.
3. Paste all of `supabase/seed.sql` and click **Run** to add the sample data (optional).
4. Go to **Project Settings > API**. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=your Project URL
   VITE_SUPABASE_ANON_KEY=your anon public key
   ```
5. Restart `npm run dev`. The "Demo data" badge disappears.
6. Register an account in the app, then approve it: **Table Editor > staff**, set `approved` to
   `true` for your row. New accounts cannot see evacuee data until approved.
7. For password-reset emails, add your site address under
   **Authentication > URL Configuration > Redirect URLs** (for example
   `http://localhost:5173/update-password` and your Vercel address).

`seed.sql` is generated from `src/data/seed.js`. After changing the sample data, run
`npm run seed` to rebuild it.

## Build the Android app

Needs Android Studio (which includes the Android SDK and Java).

```bash
npm run android
```

This builds the web app, copies it into `android/`, and opens Android Studio. Press **Run** to
install it on a phone or emulator. Run the same command again after every code change.

## Deploy the web version (Vercel)

Import the repository in Vercel and keep the default Vite settings. Add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` under **Settings > Environment Variables**. `vercel.json` already sends
every page address to the app.

## Project structure

```
src/
  analytics/pipeline.js   Data pipeline: clean, aggregate, forecast (emerging tech)
  components/             Shared UI: layout, status pill, meter, cards
  context/                AuthContext (session) and DataContext (app state)
  data/seed.js            Sample data for demo mode and seed.sql
  hooks/                  usePublicStatus (offline cache), useNetwork (Capacitor)
  lib/status.js           Center status rules (same as the CSC 106 system)
  pages/public/           Public page and volunteer form
  pages/auth/             Login, register, reset and update password
  pages/staff/            Dashboard, evacuees, register family, centers,
                          announcements, supplies, volunteers, analytics
  services/               api.js picks Supabase or demo; mappers convert rows
supabase/
  schema.sql              Tables, Row Level Security, public summary function
  seed.sql                Sample data (generated)
android/                  Capacitor Android project
```

## How the analytics work

1. **Collect:** every family registration creates evacuee records with age, sex, vulnerable group,
   center and arrival time.
2. **Clean:** records with invalid dates or ages are dropped (`cleanEvacuees`).
3. **Aggregate:** counts per center, per time block, per age band and sex, and per vulnerable group.
4. **Forecast:** each center's arrival rate over the last 6 hours, and the hours until it is full
   at that rate (`capacityForecast`).
5. **Recommend:** the open center with space that is filling slowest (`recommendCenter`). The
   dashboard shows it, and the registration form preselects it.

Every chart has a **Table** button with the same numbers.

## Privacy and security

- Evacuee names, ages and contact numbers are personal information under the
  **Data Privacy Act of 2012 (RA 10173)**. Only approved staff can read them; this is enforced by
  Row Level Security in the database, not only by the app.
- The public page gets numbers only, through the `get_public_status()` database function.
- Volunteers can submit a sign-up but cannot read other sign-ups.
- Keys go in `.env`, which is listed in `.gitignore`. The Supabase anon key is meant to be public;
  never put the `service_role` key in this app.
- All names in the sample data are fictional, and the phone numbers are placeholders.

## License

MIT. See [LICENSE](LICENSE).
