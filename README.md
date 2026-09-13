# SilicaFlights

A responsive flight discovery app and design system built with Next.js 16, React 19, JavaScript, and Sass Modules. Flight search uses Duffel test mode with worldwide airport lookup, one-way/round-trip results, filters, and itinerary details. Booking is unavailable; signup forms remain local demos.

## Development

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` for the landing page and `/design-system` for the interactive component reference. The design-system route returns 404 outside development.

## Duffel test search

Copy `.env.example` to `.env.local` and set `DUFFEL_ACCESS_TOKEN` to a Duffel test access token. The setting is server-only and `.env.local` is ignored by Git. Restart the development server after changing it. Live tokens are deliberately rejected.

Search from `/` or open `/flights` to choose a journey. Use exact dates, up to nine travelers (including an adult), and a separate age for every child aged 2–11. Infants travel on an adult’s lap. Round trips require a return date. Fare totals include taxes for all travelers, use the returned currency, and exclude optional extras. Times are local to each airport. Sandbox schedules and prices are illustrative.

`GET /api/airports?query=...` provides airport suggestions; `POST /api/flights/search` validates criteria and returns a reduced offer response. Neither endpoint returns Duffel credentials or client keys. Offers are not stored in a database; reloading results performs another search. Failed requests display errors instead of substitute sample fares.

Automated browser tests mock these endpoints, and unit tests mock the Duffel transport. The design-system search uses local fixtures. To separately verify the configured token against Duffel’s sandbox:

```sh
npm run test:duffel
```

This sends an airport lookup and a flight search; it creates no order. It prints only mode, result counts, and currencies.

### Vercel deployment

Set `DUFFEL_ACCESS_TOKEN` to the Duffel test token in the Vercel project's **Settings → Environment Variables**, targeting **Production**. Use a sensitive environment variable and keep the token server-only. Add it separately to **Preview** if preview deployments need flight search. Vercel does not receive the ignored `.env.local` file through Git.

Deploy again after saving the variable so the new deployment receives it. Verify that `/api/airports?query=Singapore` returns airport suggestions, then submit a flight search on the deployed site. If search returns `503`, check that the deployment has a valid test token. Live mode remains unsupported.

## Project structure

| Location                       | Responsibility                                              |
| ------------------------------ | ----------------------------------------------------------- |
| `src/app`                      | Routes, metadata, and private page composition              |
| `src/components/ui`            | Domain-independent atoms and molecules                      |
| `src/components/layout`        | Container, stack, grid, and section primitives              |
| `src/components/site`          | Navigation and footer                                       |
| `src/components/flight-search` | Search, filters, defaults, and validation                   |
| `src/components/signup`        | Signup forms, shared submission hook, and validation        |
| `src/data`                     | Shared travel reference data                                |
| `src/lib`                      | Shared utilities, Duffel transport, and submission adapters |
| `src/styles`                   | Global styles, tokens, and Sass mixins                      |
| `assets/fonts`                 | Local Switzer, Recoleta Alt, and Cintarini fonts            |
| `public/images`                | Local images and provenance manifest                        |
| `tests/e2e`                    | Playwright behavior, accessibility, and responsive checks   |

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
