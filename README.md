# Bioregioning Earth UI

Astro + MapLibre frontend backed by **multiple Notion databases**.

## Architecture

- **Multi-section**: Each website section maps to its own Notion database (or view)
- **Build-time data fetch**: `src/lib/notion.ts` queries all configured databases during `astro build`
- **Pages**:
  - `/` — dashboard showing all sections with aggregated map
  - `/{section}/` — filtered view for one section (e.g. `/network/`, `/funding/`)
  - `/{section}/{slug}` — detail view for a single record
- **Components**:
  - `EarthMap.astro` — MapLibre GL interactive map
  - `EntityCard.astro` — card tile
  - `NetworkSection.astro` — grid of cards

## Local development

```bash
cd "projects/Bioregioning Earth UI"
npm install
cp .env.example .env
# edit .env: NOTION_API_KEY only (no database_id needed)
npm run dev
```
Serves at `http://localhost:4321/bioregioning-earth-ui`

## Configuration

### 1. Configure your databases

Edit `src/data/databases.yaml`:

```yaml
sections:
  - id: network
    name: Network
    description: Core bioregional actors
    database_id: YOUR_DB_UUID  # ← paste Notion database ID here
    route: /
    icon: globe
```

**Finding a database ID:** Open the database in Notion. The URL contains the ID:
```
https://www.notion.so/workspace/12345678-1234-1234-1234-123456789abc?v=...
#                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
#                                      This is the database ID
```

Add as many sections as you need. Each section gets its own route and database.

### 2. Property name mapping

The UI looks for these property names in each Notion database (case-insensitive):

| UI feature | Property names checked (in order) |
|------------|-----------------------------------|
| Title/Name | `Name`, `Title`, `name`, `title` |
| Coordinates | `Lat`/`Lng`, `lat`/`lng`, `Latitude`/`Longitude` |
| Tags/Type | `Tags`, `tags`, `Type`, `type`, `Cluster`, `cluster` |
| Description | `Description`, `description`, `Notes`, `notes` |
| URL | `URL`, `Url`, `url`, `Website`, `website` |

If your Notion database uses different property names, edit `src/components/NetworkSection.astro` and `src/pages/[section]/[slug].astro` to match.

## Deployment (personal GitHub repo)

### 1. Configure Astro

Edit `astro.config.mjs`:
```js
const SITE_URL = 'https://giulioquarta.github.io';  // ← your username
```

### 2. Create target repo

- Name: `bioregioning-earth-ui`
- Public
- Skip README

### 3. Add 1 secret

`github.com/giulioquarta/bioregioning-earth-ui` → **Settings → Secrets and variables → Actions**

| Secret | Value |
|--------|-------|
| `NOTION_API_KEY` | Your Notion integration token (`ntn_…` or `secret_…`) |

Only **1 secret** is needed. Database IDs are stored in `databases.yaml` inside the repo (they are not sensitive).

### 4. Enable Pages

**Settings → Pages** → Source: GitHub Actions

### 5. Push

```bash
cd ~/bioregioning-earth-ui
npm install  # generates package-lock.json
git add .
git commit -m "feat: scaffold bioregioning earth ui"
git push origin main
```

### 6. Verify

Go to **Actions** tab. When green, the site is live at:
```
https://giulioquarta.github.io/bioregioning-earth-ui/
```

## Migrating to refibcn later

Only two things change:
1. `astro.config.mjs` → `const SITE_URL = 'https://refibcn.github.io';`
2. The repo moves from `giulioquarta` to `refibcn` — the same `databases.yaml` and workflow work unchanged.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `NOTION_API_KEY` not set error | Did you create the `.env` file locally? Is the secret added to the GitHub repo? |
| Section shows 0 records | Check `database_id` in `databases.yaml`. Make sure the Notion integration has access to that database (share the DB with your integration in Notion). |
| Map shows no markers | Check that your Notion database has `Lat` and `Lng` number properties. |
| Build fails | Is `package-lock.json` committed? Run `npm install` before pushing. |
| 404 on detail pages | Detail pages are at `/{section}/{slug}`, not `/{slug}`. Check links from cards. |
