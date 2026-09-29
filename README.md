# riaayahBMR

Muslim community safety & resource map for the Bangkok Metropolitan Region.

## Stack
- **Next.js** (App Router) + TypeScript + Tailwind — deploys straight to Vercel
- **Leaflet / react-leaflet** for the map
- **Supabase** (not yet wired up) — planned for the crowdsourced layers, the
  submission form, and the admin-approval queue

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll see the map with a working `mosques`
layer (one verified example: Haroon Mosque), a `districts` boundary layer,
and 18 more layers wired up but empty until data is added.

The map defaults to **dark mode** — toggle it with the ☀️/🌙 button at the
top of the sidebar.

## Adding your own layers on the fly
Drag a `.geojson` file onto the sidebar (or click the dashed box to pick a
file) and it's added as a new toggleable layer immediately — no code
changes, no rebuild. This works for both points and polygons (e.g. the
`districts.geojson` boundary layer was added this way). These uploads are
client-side only and reset on page reload; to make a layer permanent, add
it to `src/data/` and register it in `src/lib/layers.ts` instead.

## Layer data model

All layer config lives in `src/lib/layers.ts`. Each layer points at a
GeoJSON file in `src/data/`. Three kinds of layers:

1. **OSM-backed** (mosques, Islamic schools, halal food, cemeteries, wudu
   facilities, public transport, flood-prone areas) — populate these by
   running:

   ```bash
   npm run fetch-osm
   ```

   This calls the Overpass API and overwrites the matching files in
   `src/data/`. (The Overpass API isn't reachable from the build sandbox
   that scaffolded this project — run it from your own machine or CI.)
   Double check tag coverage after running it; OSM's Islamic-related
   tagging in Thailand is inconsistent, so some real places will be
   missing and need manual addition.

2. **Seed layers** (universities, healthcare, mental health, elderly,
   child welfare, zakat/sadaqah, women's facilities, shelters, government
   services, legal aid, Muslim-majority communities) — no reliable OSM
   tags exist for these. Research and hand-populate the matching JSON
   files in `src/data/` to the same GeoJSON shape as `mosques.json`.

3. **Community layer** (Muslim-owned businesses) — intended to be
   crowdsourced from day one via the (not-yet-built) submission form.

## Still to build
- [ ] Needs-gap layer: encode district-level Muslim population estimates
      (NSO 2015 census / academic estimates are the best available source —
      they're old and coarse, so label this clearly as an estimate in the UI)
      and compute distance-to-nearest-facility per area
- [ ] Resources/helplines section
- [ ] Real seed data for the non-OSM layers — best sourced from the
      submission form now that it exists, rather than guessed from web
      search (getting a clinic/shelter location wrong on a safety map is
      worse than leaving it empty)

## Setting up Supabase (submissions + admin approval)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, paste and run `supabase/schema.sql` — this creates
   the `submissions` table, the `admins` allow-list, and the row-level
   security policies (public can submit + read approved rows only; only
   allow-listed admins can see pending rows and approve/reject).
3. Add yourself as an admin: `insert into admins (email) values ('you@example.com');`
4. Create your admin login: Authentication > Users > Add user (use the same
   email). **Turn off public sign-ups** (Authentication > Settings) so no
   one else can create an account and try to approve things.
5. Copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key (Settings > API in the Supabase dashboard).
6. Add the same two variables in Vercel: Project > Settings >
   Environment Variables, then redeploy.

Once set up: anyone can add a place at `/submit` (they pick a category,
click the map to place it, add a name/notes). It sits as "pending" until
you sign in at `/admin` and approve or reject it. Approved submissions show
up on the main map automatically, merged in alongside the seed/OSM data for
that layer.

Without these env vars set, `/submit` and `/admin` show a friendly "not
configured yet" message instead of crashing, and the main map just runs
without community submissions.

## Deploying
Push to a GitHub repo and import it in Vercel — no config needed beyond the
defaults for a Next.js app. Set the project domain to `riaayahbmr.vercel.app`
in the Vercel project settings.
