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

All data is stored in Supabase, so every staff member sees the same live records.

**Live site:** https://cecms-app-black.vercel.app

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
| Mobile | Capacitor (Android and iOS), with the Network plugin for offline detection |
| Any device | Installable web app (PWA, `vite-plugin-pwa`): works on phones, tablets and computers, opens offline |
| Emerging tech | Data analytics and visualization (`src/analytics/pipeline.js`, Recharts) |
| Icons | Lucide React |

## Run it on your computer

Install Node.js 20 or newer and Git, then:

```bash
git clone https://github.com/markcastillon/cecms-app.git
cd cecms-app
npm install
```

Create a `.env` file with the Supabase keys (ask the team, or see the next section), then:

```bash
npm run dev
```

Open the address it prints (usually http://localhost:5173). Without the keys the app shows a
"Supabase is not set up" message.

## Connect Supabase (backend)

1. Create a free project at https://supabase.com.
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and click **Run**.
3. Paste all of `supabase/seed.sql` and click **Run** to add the sample data (optional).
4. Go to **Project Settings > API**. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=your Project URL
   VITE_SUPABASE_ANON_KEY=your anon public key
   ```
5. Restart `npm run dev`.
6. Register an account in the app, then approve it: **Table Editor > staff**, set `approved` to
   `true` for your row. New accounts cannot see evacuee data until approved.
7. So the links in confirmation and password-reset emails open the app, go to
   **Authentication > URL Configuration**:
   - set **Site URL** to your Vercel address (for example `https://cecms-app-black.vercel.app`);
   - under **Redirect URLs**, add `/login` and `/update-password` for every address you use, for
     example `https://cecms-app-black.vercel.app/login`, `https://cecms-app-black.vercel.app/update-password`,
     `http://localhost:5173/login` and `http://localhost:5173/update-password`.

   If an address is missing from the list, Supabase sends people to the Site URL instead. The app
   still takes someone who opened a reset link to the "Set a new password" page.

`seed.sql` is generated from `src/data/seed.js`. After changing the sample data, run
`npm run seed` to rebuild it.

**Updating an existing project:** `schema.sql` is safe to run again. When it changes, paste all of
it into **SQL Editor** and click **Run**; it adds the new rules and keeps your data. (November 2026
added volunteer sign-up limits and a rule that supplies can't be released beyond what was received.)

## Use it on phones, tablets and computers

The same app runs everywhere. It adjusts to small phones, phones held sideways, tablets and
large screens, keeps clear of iPhone notches and Android status bars, and uses finger-sized
buttons on touch screens.

**Supported:** iPhone and iPad with iOS 16.4 or newer (iPhone 8 and later), Android phones and
tablets with an up-to-date Chrome, and current Chrome, Edge, Safari or Firefox on computers.
(Tailwind CSS 4 needs these browser versions.)

### Install it like an app, from the website (no app store)

| Device | How |
|---|---|
| iPhone / iPad | Open the site in **Safari** > **Share** > **Add to Home Screen** |
| Android | Open the site in **Chrome** > menu **⋮** > **Install app** (or **Add to Home screen**) |
| Computer | In **Chrome** or **Edge**, click the install icon at the right end of the address bar |

It then opens full-screen with the CECMS icon. Without a connection the public page still opens
and shows the last saved numbers; staff pages need a connection. When a new version is deployed,
a "new version is ready" notice offers a **Reload** button.

### Test on your own phone while developing

Connect the phone to the same Wi-Fi as your computer, then run:

```bash
npm run dev:phone
```

Open the **Network** address it prints (for example `http://192.168.1.10:5173`) on the phone.

## Build the Android app

Needs Android Studio (which includes the Android SDK and Java).

First add the live website address to `.env`, so links in sign-up and password-reset emails sent
from the phone open the website (the app's own address only exists on the phone):

```
VITE_SITE_URL=https://cecms-app-black.vercel.app
```

Then:

```bash
npm run android
```

This builds the web app, copies it into `android/`, and opens Android Studio. Press **Run** to
install it on a phone or emulator. Run the same command again after every code change.

## Build the iPhone app (iOS)

Apple only allows building iOS apps on a **Mac** with **Xcode** (free from the Mac App Store).
Set `VITE_SITE_URL` in `.env` as for Android, then on the Mac:

```bash
npm install
npm run ios
```

This builds the web app, copies it into `ios/`, and opens Xcode. Choose your iPhone or a simulator
and press **Run**. With a free Apple ID you can install it on your own iPhone (it must be
re-installed every 7 days); publishing on the App Store needs the Apple Developer Program.
Without a Mac, iPhone users can install the website instead (see above).

## App icons and splash screens

The source images are in `assets/` (made from the house logo in `public/favicon.svg`). After
changing them, regenerate the Android and iOS icons and splash screens with:

```bash
npx @capacitor/assets generate --android --ios
```

The website's icons are `public/pwa-192.png`, `public/pwa-512.png`, `public/pwa-maskable-512.png`
and `public/apple-touch-icon.png`.

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
  data/seed.js            Sample data used to generate seed.sql
  hooks/                  usePublicStatus (offline cache), useNetwork (Capacitor)
  lib/status.js           Center status rules (same as the CSC 106 system)
  pages/public/           Public page and volunteer form
  pages/auth/             Login, register, reset and update password
  pages/staff/            Dashboard, evacuees, register family, centers,
                          announcements, supplies, volunteers, analytics
  services/               api.js connects to Supabase; mappers convert rows
supabase/
  schema.sql              Tables, Row Level Security, public summary function
  seed.sql                Sample data (generated)
android/                  Capacitor Android project
ios/                      Capacitor iOS project (open with Xcode on a Mac)
assets/                   Source images for app icons and splash screens
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
