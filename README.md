# SilicaFlights

A responsive flight discovery app and design system built with Next.js 16, React 19, JavaScript, and Sass Modules. Flight search supports Duffel test mode and Travelport pre-production through one provider-independent API, with local worldwide airport lookup, one-way/round-trip results, filters, and itinerary details. Booking is unavailable; signup forms remain local demos.

## Development

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` for the landing page and `/design-system` for the interactive component reference. The design-system route returns 404 outside development.

## Flight search providers

Copy `.env.example` to `.env.local`. Set `FLIGHTS_PROVIDER` to exactly `duffel` or `travelport` and fill in the selected provider's credentials. All settings are server-only; `.env.local` is ignored by Git. Restart the development server after changing them. Only the selected provider's credentials are required, and only that provider receives a search. There is no automatic fallback or merging between providers.

| Setting                      | Purpose                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `FLIGHTS_PROVIDER`           | `duffel` or `travelport`; required                              |
| `DUFFEL_ACCESS_TOKEN`        | Duffel token beginning with `duffel_test_`                      |
| `TRAVELPORT_CLIENT_ID`       | Provisioned Travelport OAuth client ID                          |
| `TRAVELPORT_CLIENT_SECRET`   | Provisioned Travelport OAuth client secret                      |
| `TRAVELPORT_USERNAME`        | Provisioned API username                                        |
| `TRAVELPORT_PASSWORD`        | Provisioned API password                                        |
| `TRAVELPORT_PCC`             | PCC and GDS identifier, for example `TEST_1G`                   |
| `TRAVELPORT_CONTENT_SOURCES` | `GDS`, `NDC`, or `GDS,NDC` (default); subject to account access |

Duffel remains the initial selection. Switch to Travelport after its account coverage check passes. This implementation supports trial searches only: Duffel live tokens are rejected, and Travelport uses fixed pre-production endpoints. No order, booking, payment, or ticketing API is called.

Search from `/` or open `/flights` to choose a journey. Use exact dates, up to nine travelers (including an adult), and a separate age for every child aged 2–11. Infants travel on an adult’s lap. Round trips require a return date. Fare totals include taxes for all travelers, use the returned currency, and exclude optional extras. Times are local to each airport. Sandbox schedules and prices are illustrative.

### Search interface

The results-page search controls stay pinned while the result count, filters, and flight cards scroll. The header uses a white fade and strong progressive blur, with room for the search form's translucent outer outline and Advanced settings beneath it. Mobile uses a compact route pill that opens the search editor; journey dates and traveler counts scroll below it. Interacting with the search inputs clears displayed validation feedback; submitting again revalidates the values and focuses the first invalid field.

Advanced filters use a consistent dialog height: `56rem` on desktop and `50rem` below 900px, capped to the visible viewport. Only the active tab panel scrolls; the heading, tabs, and Cancel/Apply actions stay in place. Clear filters sits beside Close and resets the draft and its errors without switching tabs. Apply commits the draft; Cancel, Close, and Escape discard it. Trip and cabin selections use `blue-500` (`#437EFD`) with `blue-950` labels for readable contrast.

`Modal` supports optional `headerActions`, `className`, and `layout="fixed"`; its default sizing remains content-driven. `Tabs fill` fills the available space and scrolls the active panel. The focused checks in `tests/e2e/search-ui-polish.spec.mjs` cover pinned search controls, short screens, enlarged text, and draft reset behavior.

### API and normalization

`GET /api/airports?query=...` returns `{ airports: [{ value, label, detail }] }`. It searches a checked-in OurAirports catalog and needs no supplier credentials or network calls. Queries match IATA codes, city names, and airport names, with accents normalized and up to 20 suggestions. Catalog membership does not guarantee airline inventory. To refresh the public-domain snapshot with Python 3:

```sh
npm run airports:update
```

The updater checks required fields, unique IATA codes, and minimum catalog size before replacing `src/data/airport-catalog.json`. Its source URL, retrieval date, license, and source SHA-256 are stored with the data. The generated file is excluded from formatting. Review the data diff before committing a refresh.

`POST /api/flights/search` retains the existing Yup criteria and `{ id, testMode, offers }` response. `service.js` is the server-only entry point; `client.js` selects the configured adapter and serializes an explicit public contract. Search, offer, slice, and segment IDs are opaque UUIDs valid only within the current search display. Credentials, raw supplier references, and supplier selection never enter the public response. No database is needed for these temporary search results.

Adapters preserve whole-itinerary prices in the original currency, airport-local times, operating carriers where supplied, baggage quantities or weights, and fare conditions. Travelport round trips match product references and combinability codes with the same content source, currency, and total; the journey price is never added twice. Unsupported split tickets are excluded. Missing baggage inclusion and fare conditions remain unknown. Weight-based allowances are not displayed as bag counts. Travelport results require a refresh after ten minutes, or sooner if the supplier supplies an earlier expiry; this freshness limit is not a price guarantee.

Both providers share a 30-second request deadline and caller cancellation. Travelport caches OAuth tokens in the server process, shares concurrent refreshes, refreshes before expiry, and retries one search after a 401. It follows the provisioned dashboard's password-grant JSON request at `auth.pp.travelport.com` and sends the PCC through `TVP-PCC-Core`. Authentication, rate-limit, timeout, malformed-response, and upstream errors become safe public messages. Server diagnostics record provider, elapsed time, result count, category, and invalid configuration field names, without raw payloads or credentials.

### Nigeria coverage check

Automated tests use synthetic Duffel data and reduced official Travelport GDS/NDC examples. Browser tests exercise both adapters' normalized output through the shared UI at mobile and desktop widths. The design-system search uses local fixtures. Account access is checked separately:

```sh
npm run test:flights -- --provider travelport
npm run test:duffel
```

The first command tests Travelport without changing `.env.local` or the app's active provider. `npm run test:flights` without an override tests the configured provider. The command searches LOS–ABV, ABV–PHC, LOS–LHR, and ABV–LHR at 7, 14, and 30 days ahead for one adult. It records route, date, result count, airline codes, currencies, latency, and safe failure categories in ignored `test-results/flights-{provider}-coverage.json`. Authentication and rate-limit failures stop the matrix early.

One fresh priced itinerary on any airline serving a Nigerian airport passes the initial account check. The Duffel adapter removes simulated Duffel Airways (`ZZ`) offers before returning search results, checking the offer owner and every operating and marketing carrier. If only simulated offers are returned, visitors see the normal “No flights found” state. Domestic and international availability are reported separately. This does not establish production coverage or require any particular Nigerian airline. Keep Duffel selected until Travelport credentials and account results have been verified; trial responses alone cannot establish production availability.

### Vercel deployment

Set `FLIGHTS_PROVIDER` and the selected provider's settings in the Vercel project's **Settings → Environment Variables**, targeting **Production**. Mark credentials sensitive and keep them server-only. Add settings separately to **Preview** if preview deployments need flight search. Vercel does not receive the ignored `.env.local` file through Git. The deployment environment named Production still runs trial flight searches with this implementation.

Deploy again after saving variables so the new deployment receives them. Verify that `/api/airports?query=Singapore` returns airport suggestions, then submit a flight search on the deployed site. If search returns `503`, check the server's safe diagnostic category and configuration field names. Provider changes require no frontend changes.

## Project structure

| Location                       | Responsibility                                             |
| ------------------------------ | ---------------------------------------------------------- |
| `src/app`                      | Routes, metadata, and private page composition             |
| `src/components/ui`            | Domain-independent atoms and molecules                     |
| `src/components/layout`        | Container, stack, grid, and section primitives             |
| `src/components/site`          | Navigation and footer                                      |
| `src/components/flight-search` | Search, filters, defaults, and validation                  |
| `src/components/signup`        | Signup forms, shared submission hook, and validation       |
| `src/data`                     | Shared travel reference data                               |
| `src/lib`                      | Shared utilities, airport lookup, and submission adapters  |
| `src/lib/flights/providers`    | Duffel and Travelport transport and response normalization |
| `src/styles`                   | Global styles, tokens, and Sass mixins                     |
| `assets/fonts`                 | Local Switzer, Recoleta Alt, and Cintarini fonts           |
| `public/images`                | Local images and provenance manifest                       |
| `tests/e2e`                    | Playwright behavior, accessibility, and responsive checks  |

`src/app/(landing-page)` owns `/`, and `src/app/design-system` owns the development showcase. The root layout supplies shared fonts and global styling.

Each reusable component has a named `.jsx` file and a colocated Sass Module when it owns styles. Component classes use BEM (`block__element--modifier`) and bracket notation, for example `styles['button--primary']`. `@/` resolves to `src/`.

## Checks

```sh
npm run lint
npm run format:check
npm test
npm run test:unit
npm run build
```

Playwright uses installed Google Chrome and starts the development server automatically when one is not running on port 3000. For production preview, run `npm run build` followed by `npm start`.

### TestSprite UI testing

TestSprite MCP supports the local app on port 3000 and requires Node.js 22 or newer plus a TestSprite account/API key. Install the official server with `npm install --global @testsprite/testsprite-mcp@0.0.45` using that Node runtime. Add `TESTSPRITE_API_KEY` to the ignored `.env.local` file.

The `scripts/testsprite-mcp.mjs` launcher reads only that key from `.env.local` and starts the installed server. Register it in Codex with `codex mcp add testsprite -- /absolute/path/to/node /absolute/path/to/project/scripts/testsprite-mcp.mjs /absolute/path/to/@testsprite/testsprite-mcp/dist/index.js`. Restart the MCP connection after adding or changing the key.

Run against the current local app using frontend mode, port 3000, no login, and [the UI requirements](tests/testsprite/ui-requirements.md). TestSprite runs browser tests in its cloud and consumes account credits. Generated tests, configuration, and reports stay in the ignored `testsprite_tests/` directory. Existing Playwright checks remain available through `npm test`.

Review the generated replay assertions alongside TestSprite's reported status. In the initial run, some passing cases omitted their required checks, and the browser agent could not install the request delays needed for loading-state tests. Use the existing Playwright suite for precise layout and network timing checks. The reviewed local report is saved at `testsprite_tests/testsprite-mcp-test-report.md`.

### Formatting

Run `npm run format` to apply ESLint layout fixes followed by Prettier, or `npm run format:check` for a read-only Prettier and ESLint check. Prettier covers source, tests, documentation, root configs, and GitHub workflows while honoring `.prettierignore` and `.gitignore`; ESLint covers JavaScript with its own configured ignores.

The exact Prettier version is pinned in `package.json` and `package-lock.json`; use `npm ci` for reproducible installs. `.prettierrc.json` defines 100-column wrapping, two-space indentation, semicolons, single JavaScript quotes, double JSX quotes, trailing commas, and LF line endings. Markdown keeps its existing paragraph wrapping. `.editorconfig` aligns editor indentation and line endings; VS Code workspace settings enable formatting on save with the recommended Prettier extension.

ESLint checks code quality and statement padding, with `eslint-config-prettier` last in the flat config to disable conflicting formatting rules. Build output, lockfiles, exported assets, source maps, and generated `.module.css` files are excluded from formatting. Edit the `.module.scss` sources; their generated CSS is also ignored by Git.

Spacing conventions:

- Two spaces per indentation level, spaces inside object/import braces, spaces around operators and after commas, and no padding inside function-call parentheses or array brackets. Prettier enforces these conventions and removes extra code whitespace.
- A blank line after the import group and after directives such as `'use client'`. Consecutive imports and consecutive directives may stay together.
- A blank line around function/class declarations and exports, and before a return statement when another statement precedes it. ESLint Stylistic adds these gaps; Prettier preserves them and collapses multiple empty lines to one.
- One final newline and no unnecessary blank lines at the start or end of a file. Preserve meaningful whitespace in string literals, Markdown hard breaks, and inline HTML/JSX text.

VS Code displays boundary whitespace, uses two-space indentation, and applies the statement-padding rule on explicit saves alongside Prettier. `npm run format` only applies ESLint fixes classified as layout changes before formatting.

The Formatting GitHub Actions workflow checks pull requests and pushes to `main` using locked dependencies. Its **Prettier** check runs `format:check`, including ESLint spacing checks, and reports failures without rewriting files. Configure that check as required in branch protection if merges should be blocked by formatting failures.

## Documentation

- [Architecture and coding conventions](docs/architecture.md)
- [Code organization plan](docs/code-organization-plan.md)
- [Design system contracts and states](docs/design-system.md)
- [Original implementation plan](docs/implementation-plan.md)

Read [AGENTS.md](AGENTS.md) and the relevant version-specific guides in `node_modules/next/dist/docs/` before changing Next.js behavior.
