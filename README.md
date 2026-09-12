# SilicaFlights

A responsive flight discovery landing page and design system built with Next.js 16, React 19, JavaScript, and Sass Modules. Search and signup use local demo adapters: they do not book flights, send personal information, or create subscriptions.

## Development

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` for the landing page and `/design-system` for the interactive component reference. The design-system route returns 404 outside development.

## Project structure

| Location                       | Responsibility                                            |
| ------------------------------ | --------------------------------------------------------- |
| `src/app`                      | Routes, metadata, and private page composition            |
| `src/components/ui`            | Domain-independent atoms and molecules                    |
| `src/components/layout`        | Container, stack, grid, and section primitives            |
| `src/components/site`          | Navigation and footer                                     |
| `src/components/flight-search` | Search, filters, defaults, and validation                 |
| `src/components/signup`        | Signup forms, shared submission hook, and validation      |
| `src/data`                     | Shared travel reference data                              |
| `src/lib`                      | Shared utilities and demo submission adapters             |
| `src/styles`                   | Global styles, tokens, and Sass mixins                    |
| `assets/fonts`                 | Local Switzer, Recoleta Alt, and Cintarini fonts          |
| `public/images`                | Local images and provenance manifest                      |
| `tests/e2e`                    | Playwright behavior, accessibility, and responsive checks |

`src/app/(landing-page)` owns `/`, and `src/app/design-system` owns the development showcase. The root layout supplies shared fonts and global styling.

Each reusable component has a named `.jsx` file and a colocated Sass Module when it owns styles. Component classes use BEM (`block__element--modifier`) and bracket notation, for example `styles['button--primary']`. `@/` resolves to `src/`.

## Checks

```sh
npm run lint
npm run format:check
npm test
npm run build
```

Playwright uses installed Google Chrome and starts the development server automatically when one is not running on port 3000. For production preview, run `npm run build` followed by `npm start`. Use `npm run format` to apply Prettier conventions.

## Documentation

- [Architecture and coding conventions](docs/architecture.md)
- [Code organization plan](docs/code-organization-plan.md)
- [Design system contracts and states](docs/design-system.md)
- [Original implementation plan](docs/implementation-plan.md)

Read [AGENTS.md](AGENTS.md) and the relevant version-specific guides in `node_modules/next/dist/docs/` before changing Next.js behavior.
