# Static quiz site

This folder is the site source and Cloudflare Pages project root. The app uses native browser ES modules without a frontend framework or runtime bundler. CSS, translations, question banks and vendored report engines are separate static assets.

## Develop and test

Run commands from this folder with Node.js 24:

```sh
npm ci
npx playwright install chromium firefox
npm run check
```

`npm run check` builds the production site, runs unit, SQLite, schema and module tests, then tests source and production output in desktop Chromium, Firefox and a mobile viewport. On machines without a working Firefox runtime, run `npm run build && npm test` and `npm run test:e2e -- --project=chromium --project=mobile`; CI runs all projects.

Run `node scripts/serve.cjs` to serve this source at `http://127.0.0.1:4173/`. Only local source sessions with `?debug=1` load `nnDebug`; these reports cannot submit scores or overwrite saved real reports. Production builds exclude both the debug module and its bootstrap.

## Modules

| Module | Responsibility |
| --- | --- |
| config / state | Versioned configuration and explicitly imported session state |
| messages / i18n | Nested dictionary lookup, locale selection and DOM translation |
| questions / quiz-logic / quiz-engine | Question banks, sampling helpers and answer lifecycle |
| spam-detect / scores | Consistency scoring and score API requests |
| storage | Saved progress and reports |
| result / ui | Report rendering, radar and UI controls |
| export / dependencies | Sharing, PNG export and local engine loading |
| main / debug | App bootstrap and opt-in local development tools |

## Deploy

Configure Cloudflare Pages with project root `男娘测试`, build command `npm run build`, and output directory `dist`. The Pages Functions entry is `functions/api/score.js` in this same project root, and the existing D1 database must be bound as `DB`. The build emits static assets into this folder's `dist/` and excludes the Functions source and debug tools.

`npm run test:pages` invokes the pinned Wrangler 4.151.0 CLI and starts the local Pages runtime from this project root. It applies migrations to an isolated local D1 database and exercises the real `/api/score` route with GET, POST and OPTIONS requests, without mocking the route. No production credentials are used.

Apply the SQL files in `migrations/` to the bound D1 database through the deployment workflow, in order. `0003_remove_reported_debug_submission.sql` removes only the exact synthetic row reported in issue #28 and rebuilds the summary; it is idempotent and is not run by the static build. Back up the database before applying data migrations.

The locale template uses the same nested shape as the dictionaries. Translate all empty strings, remove `__translatorNotes`, and run `npm test` to validate keys, types and placeholders against `locales/locale.schema.json`.
