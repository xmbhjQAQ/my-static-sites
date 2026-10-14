# Static quiz site

The site source is in `男娘测试/`. It uses native browser ES modules with no frontend
framework or runtime bundler. CSS, translations, question banks and vendored
report engines are separate static assets.

## Develop and test

Use Node.js 24, then run:

```sh
npm ci
npx playwright install chromium firefox
npm run check
```

`npm run check` builds the production site, runs unit/SQLite/schema/module tests,
and tests source and production output in desktop Chromium, Firefox and a mobile
viewport. On machines without a working Firefox runtime, run
`npm run build && npm test` and
`npm run test:e2e -- --project=chromium --project=mobile`; CI runs all three.

Run `node scripts/serve.cjs` to serve the source at `http://127.0.0.1:4173/`.
Only local source sessions with `?debug=1` load `nnDebug`; these reports cannot
submit scores or overwrite saved real reports. Production builds exclude both
the debug module and its bootstrap.

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

`npm run build` produces `dist/` with static assets, migrations, locales,
question banks and vendor assets. The repository-root `functions/api/score.js`
forwards to the shared score handler in the source directory; Pages discovers
this root Functions entry separately from the static output. Configure Cloudflare Pages from the repository
root with build command `npm run build` and output directory `dist`. Serving the
source directory directly also works; production hostnames never load the debug
console. Debug assets and Functions source are excluded from the static `dist/` directory.

`npm run test:pages` starts the real local Pages runtime from the repository root,
applies migrations to an isolated local D1 database, and tests GET/POST/OPTIONS on
`/api/score` without mocking the route. It checks valid submissions, duplicates,
debug rejection and summary statistics, then stops the runtime and removes its
temporary test configuration/database. No production credentials are required.

Bind the existing D1 database as `DB`. Apply database migrations through your
deployment workflow, in order. `0003_remove_reported_debug_submission.sql` removes
only the exact synthetic row reported in #28 and rebuilds the summary; it is
idempotent and is not automatically applied by the static build. Back up the
database before applying a data migration.

The locale template uses the same nested shape as the dictionaries. Translate
all empty strings, remove `__translatorNotes`, and run `npm test` to validate keys,
types and placeholders against `locales/locale.schema.json`.
