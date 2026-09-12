# SilicaFlights code organization plan

## Objective

Reorganize JavaScript around routes, shared UI, and domain ownership while preserving the website and design system. Retain Atomic Design composition, Sass Modules, local fonts, `rem` sizing, and the `62.5%` root font size.

Reference [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure), [Vercel Commerce](https://github.com/vercel/commerce/tree/main/components), and [React component/state principles](https://react.dev/learn/thinking-in-react). Keep a single application; do not introduce TypeScript, a monorepo, or a state-management library.

## Target ownership

| Location                       | Responsibility                                        |
| ------------------------------ | ----------------------------------------------------- |
| `src/app`                      | Routes, metadata, private page composition, page copy |
| `src/components/ui`            | Domain-independent atoms and molecules                |
| `src/components/layout`        | Structural primitives                                 |
| `src/components/site`          | Navigation and footer                                 |
| `src/components/flight-search` | Search, settings editor, defaults, validation         |
| `src/components/signup`        | Separate forms, shared submission hook, validation    |
| `src/data`                     | Shared travel reference data                          |
| `src/lib`                      | Generic utilities and explicit demo adapters          |
| `src/styles`                   | Global styling, tokens, mixins                        |
| `tests/e2e`                    | Existing Playwright checks                            |

Keep configuration, scripts, docs, `assets/fonts`, and `public/images` at the root. [architecture.md](architecture.md) specifies the complete structure and conventions.

## Migration sequence

1. Run existing checks and capture desktop/mobile reference screenshots before moving code.
2. Move application code into `src/`; update aliases, fonts, Sass imports, formatting commands, and tests. Remove the old root `app` after migration.
3. Split bundled controls, typography, fields, and selection components into named `.jsx` files and colocated Sass Modules. Preserve props, semantic HTML, and state styling.
4. Move search defaults and validation beside search components. Separate the settings editor from its dialog. Split founder/weekly form composition while sharing submission behavior through a hook.
5. Separate travel data from landing content. Group the home route, cards, grids, template, and landing content under `src/app/(landing-page)`, preserving `/`. Keep the showcase under `src/app/design-system`, with fonts and global styles in the shared root layout. Split the design-system showcase into focused sections with local state.
6. Document conventions, update the README, and enforce ownership with ESLint. Verify behavior, visuals, accessibility, and production routes.

## Interfaces and conventions

Use kebab-case filenames/folders, `.jsx` for JSX, `.js` for logic, PascalCase named components, camelCase functions/props, and `use`-prefixed hooks. CSS Module classes use BEM (`block__element--modifier`) with lowercase kebab-case and bracket notation in JSX. Retain framework-required default exports and special filenames.

URLs and documented component props remain stable. Internal imports change to direct paths. Replace the combined SignupForm implementation with the existing public FounderSignupForm and WeeklyDealsForm plus a private shared hook.

Avoid cross-layer Sass bundles and broad JavaScript barrels. Shared UI cannot depend on domain code; shared components cannot depend on routes. Create no empty directories or speculative abstractions.

## Acceptance criteria

- Lint, formatting, the existing 16 Playwright cases, and production build pass.
- `/` works and `/design-system` returns 404 outside development.
- Search validation, destination initialization, filter Apply/Cancel/Clear, signup loading/error/retry/success, and duplicate submission protection remain intact.
- Keyboard selection, modal focus restoration, accessible labels, errors, and disabled controls remain intact.
- Desktop/mobile comparisons preserve layout, fonts, founder alignment, chip spacing, and shadow-based states, including Join Founders hover.
- No stale imports, duplicate implementations, or layer-wide component Sass bundles remain.

Default: no intended visual or product behavior changes. Deployment and backend integration are outside this refactor.
