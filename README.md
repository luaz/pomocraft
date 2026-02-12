# PomoCraft

A simple pomodoro task client-side web application

DEMO: https://pomocraft.luasoftware.com/

## DEV

```
nvm use 20
npm run dev
```

## DEPLOYMENT

Automatic Deployment via Github to Cloudflare Page (Nuxr v4)

- Don't edit nitro.preset: https://nuxt.com/deploy/cloudflare#git-integration
- Build configuration: (In a standard Nuxt build, the output is .output/public. However, the Nitro preset for Cloudflare Pages specifically bundles the worker (server logic) and the static files into a single dist directory. This is the "industry standard" for how Cloudflare's own integration expects a full-stack Nuxt app to look.)
  - Build command: npm run build
  - Build output: dist
- Create .npmrc with `legacy-peer-deps=true` to solve `Invalid: lock file's commander@11.1.0 does not satisfy commander@13.1.0`

## TODO

- Export IndexedDB: https://dexie.org/docs/ExportImport/dexie-export-import
- Task add description/note
- Highlght active task
- Swap task half way
- Show average pomodoro per day for the last 30 days
- Change to game style UI (maybe implement Themes)

## UPDATES

2026-02-12:

- Delete/Undelete Project
- Upgrade to Nuxy v4
- Task Active/Keep/Completed/Deleted status
- Reorg task position
