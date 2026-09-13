# Architecture and coding conventions

## Ownership

Application code lives in `src/`. Configuration, scripts, documentation, fonts, and public assets stay at the root. `@/` resolves to `src/` through `jsconfig.json`.

| Owner                      | Contains                                                           | May depend on                                              |
| -------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| `app`                      | Routes, metadata, private page components, page copy               | Components, shared data, utilities, explicit page examples |
| `components/ui`            | Domain-independent atoms and molecules                             | Other UI primitives, generic utilities                     |
| `components/layout`        | Structural primitives                                              | Generic utilities and shared styles                        |
| `components/site`          | Navigation and footer                                              | UI, layout, shared data and utilities                      |
| `components/flight-search` | Search UI, settings editor, defaults, validation                   | UI, layout, shared data and utilities                      |
| `components/signup`        | Founder/weekly forms, submission hook, validation                  | UI, shared data and utilities                              |
| `data`                     | Shared travel reference data                                       | Shared data and utilities                                  |
| `lib`                      | Shared utilities, flight request/offer logic, and service adapters | Generic libraries and utilities                            |

Dependencies flow from page composition into domain components and shared primitives. Shared code cannot import from `app`. UI/layout primitives cannot depend on domain components or travel data. Utilities and data cannot depend on components. `lib/flights` owns shared request validation, query serialization, offer normalization, and transport; its `duffel.js` entry point is server-only and reads credentials. Domain components import pure flight logic directly. ESLint enforces these boundaries for alias and relative imports.

The design-system route intentionally renders landing-page cards as examples. Those imports remain within `app`; the cards retain their page ownership.

Create a new ownership folder only when it has real code to own. Avoid catch-all collections: name modules for their responsibility and keep domain logic beside its feature.

## Directory structure

```text
src/
  app/
    layout.jsx
    (landing-page)/
      page.jsx                  # Public URL: /
      _components/              # Landing page, cards, and content grids
      _data/landing-content.js
    design-system/
      page.jsx
      _components/              # Showcase shell, sections, and examples
  components/
    ui/
      button/
        button.jsx
        button.module.scss
      form-field/
      combobox/
      ...
    layout/
      container/
      stack/
      grid/
      section/
    site/
      navigation/
      footer/
    flight-search/
      flight-search-form/
      advanced-search-dialog/
      settings-editor/
      defaults.js
    signup/
      founder-signup-form/
      weekly-deals-form/
      signup-feedback/
      use-signup-submission.js
      schemas.js
  data/travel-locations.js
  lib/
    cx.js
    dates.js
    demo-submission.js
    validation.js              # Yup result/error adapter
    flights/
      search.js                # Criteria, request and query serialization
      schemas.js               # Shared Yup search/settings/price schemas
  styles/
    globals.scss
    _variables.scss            # Color and font-size maps
    _functions.scss            # Validated raw Sass token lookups
    _tokens.scss
    _mixins.scss
    _index.scss
```

The `(landing-page)` route group owns the home page and its private components and content. Parentheses keep the public URL at `/`. The `design-system` folder owns `/design-system`. Fonts and global styling remain in the shared root `layout.jsx`.

Route `_components` folders are private, not URL segments. Keep route files focused on Next.js responsibilities. Do not reintroduce root `app/` alongside `src/app/`: Next.js prioritizes the root directory.

## Atomic Design

Atomic Design describes composition; folder ownership describes where maintainers find components.

- Atoms: Button, Input, Heading, Text, Icon, and other primitives in `components/ui`.
- Molecules: FormField, Combobox, MultiSelect, Tabs, and Modal, also in `components/ui`.
- Organisms: search, signup, navigation, footer, and route-owned content grids.
- Templates: the route-owned LandingPage composition.
- Pages: Next.js entry points supplying content and query values.

Promote a component into shared UI when its interface is domain-independent. A destination card constructing a flight-search URL belongs with the landing page.

## Naming and imports

| Item                        | Convention                     | Example                             |
| --------------------------- | ------------------------------ | ----------------------------------- |
| Folders and filenames       | kebab-case                     | `founder-signup-form`               |
| JSX files                   | `.jsx`                         | `founder-signup-form.jsx`           |
| Logic, data, hooks          | `.js`                          | `use-signup-submission.js`          |
| Components                  | PascalCase named exports       | `FounderSignupForm`                 |
| Hooks                       | camelCase beginning with `use` | `useSignupSubmission`               |
| Variables, functions, props | camelCase                      | `onValueChange`                     |
| Sass Modules                | Match the component filename   | `button.module.scss`                |
| Sass partials               | Leading underscore             | `_mixins.scss`                      |
| CSS Module identifiers      | BEM, lowercase kebab-case      | `styles['form-field--with-action']` |
| Browser tests               | `.spec.mjs`                    | `landing-page.spec.mjs`             |

Keep one independently reusable component per file; small private helpers may remain with their owner. Use named exports except where Next.js or configuration conventions require defaults. Avoid application-wide barrels mixing unrelated client and server exports.

Use `@/` across ownership boundaries and relative imports within an owner. Import Sass Modules as `styles`, after JavaScript imports. A component without its own styles does not need an empty Sass file.

```jsx
import { Button } from '@/components/ui/button/button';
import { flightSearchSchema } from '@/lib/flights/schemas';
import { validateForm } from '@/lib/validation';
import styles from './flight-search-form.module.scss';
```

## React and Next.js patterns

- Keep pages, layouts, static composition, and foundations server-renderable. Place `'use client'` on interactive entry points using hooks, effects, or browser APIs. Their imported descendants enter the client graph without repeating the directive everywhere.
- Keep state with its closest meaningful owner. Compute derived values during rendering; retain native forms, labels, and keyboard semantics.
- Share stateful behavior through focused hooks. `useSignupSubmission` owns validation, invalid-field focus, pending protection, and loading/success/error states for separately composed forms.
- Use effects to synchronize with browser APIs, such as dialogs and query-driven focus. Handle direct user actions in event handlers.
- Use explicit props and callbacks. Document complex value shapes and callback contracts with JSDoc. Submission callbacks resolve on success and throw on failure.
- Define form validation with Yup schemas. Signup schemas live beside their forms; flight schemas live in `lib/flights/schemas.js` and are shared by client controls and the search API. `lib/validation.js` adapts Yup results to field errors without owning validation rules. Flight schemas use strict validation to reject coerced API values; signup schemas trim submitted strings. Shared dates live in `lib/dates.js`; travel data lives in `data/travel-locations.js`; request and query serialization live in `lib/flights/search.js`.
- Keep React Compiler enabled. Add manual memoization only for an identified need.
- Preserve `/`, destination query initialization, and the development-only `/design-system` route. Signup and design-system demo adapters send no network requests and persist no personal information. Public flight search uses the server API routes; the design-system explicitly opts into local fixtures.

## Styling

Colocate Sass Modules with their owner. Global resets, root sizing, and semantic custom properties belong in `styles/globals.scss`; tokens and mixins belong in Sass partials.

Define opaque colors and font sizes in the `$colors` and `$font-sizes` maps in `_variables.scss`. Colors use family-and-shade names such as `blue-700`, `slate-200`, and `amber-300`, plus the `white` and `black` constants. These are custom SilicaFlights values, not Tailwind's palette. Shades increase from light to dark within each family using sparse steps from 50 to 950; intermediate steps of 50 preserve distinct existing colors. Add only colors that are needed, and do not create semantic or component-specific aliases. The historical [color migration table](./color-palette-migration.md) records the replaced names and exact values.

Use `ds.color('blue-700')` and `ds.font-size('body')` through the styles entry point. These return raw Sass values, and unknown keys fail compilation with an available-token list. Quote names so `'white'` is interpreted as a string. Supply opacity separately with `ds.color('blue-700', 0.2)`: the optional argument must be a finite, unitless number from 0 to 1; an omitted or `null` opacity leaves the base color opaque. Do not store translucent duplicates in the palette. Keep map lookups inside the token layer.

Select responsive sizes explicitly inside the existing breakpoint mixins: `hero` and `section` use their `hero-desktop` and `section-desktop` variants at `ds.from(desktop)`. Raw values do not respond to CSS-property overrides. Preserve the root sizing reset, font-family variables from `next/font/local`, and CSS keywords such as `inherit`, `currentColor`, and `transparent`.

`_tokens.scss` generates `--color-<family>-<shade>` properties (plus `--color-white` and `--color-black`) and the existing `--text-*` properties from the maps. Retired color property names are not retained as aliases. The design-system color palette reads the generated CSS properties in a small client component, so swatches, family groups, shade labels, and displayed values derive from the Sass map and refresh when stylesheets change. Turbopack does not support ICSS `:export` rules; keep the remaining foundations content server-rendered. Component state properties such as `--button-background` remain dynamic; assign Sass values using interpolation: `--button-background: #{ds.color('amber-300')}`. Use interpolation around a font-size accessor in `font` shorthands to preserve the CSS slash separator: `font: 600 #{ds.font-size('card')}/1.25 var(--font-body), sans-serif`. Spacing, radii, composite shadows, motion, and breakpoint definitions keep their current organization; colors within composite shadows use the same color accessor.

The dependency direction is variables → functions → token-generation/mixins → component styles. Internal partials import their dependencies directly; only consuming styles use the public entry point, preventing circular imports.

All authored component classes use BEM. Name each block after its owning component or Sass filename, use `__element` for its internal parts, and `--modifier` for a variant. Compiled element names remain flat: use `calendar__month-button`, not `calendar__header__button`.

Nest component styles inside their owning block with Sass's parent selector: `&__element` and `&--modifier`. Nest an element's modifiers, states, and descendants inside that element. Use two-space indentation and a blank line before nested rules and between sibling rules. Prettier formats existing nesting; it does not restructure flat selectors automatically.

```scss
.button {
  /* base control */

  &--primary {
    /* .button--primary */
  }

  &--size-sm {
    /* .button--size-sm */
  }

  &:focus-visible {
    /* focus state */
  }
}

.picker-popover {
  &__trigger {
    /* .picker-popover__trigger */
  }

  &__value {
    &--placeholder {
      /* .picker-popover__value--placeholder */
    }
  }
}
```

Access CSS Module exports with bracket notation, including block names: `styles['button']`. Apply the base class alongside modifiers using `cx`. Map variant, size, tone, and status props through explicit class maps; prop names and accepted values remain independent of CSS names. Size modifiers use `--size-sm`, tone modifiers use `--tone-muted`, and boolean modifiers use names such as `--compact` and `--with-action`.

Keep browser pseudo-classes (`:hover`, `:focus-visible`, `:disabled`) and semantic ARIA/React Aria data-state selectors on the relevant BEM class. Existing class-driven states use modifiers such as `combobox__option--highlighted`; do not introduce duplicate state just to produce a class. Use descendant nesting only for actual descendant relationships: `.block { &__element {} }` must compile to `.block__element`, without adding a `.block` ancestor requirement.

Place base declarations before nested rules where the cascade permits. Keep responsive rules inside their owning block or element; a breakpoint affecting several elements can remain grouped at block level. Preserve selector specificity and cascade-sensitive rule order, including later overrides, even when an element block must be reopened. Element names must not mirror the DOM nesting depth.

Portaled elements retain their owning block names even when rendered elsewhere in the DOM. Components returning fragments can own BEM elements without an extra layout wrapper. CSS Modules still scope the compiled names; never select their generated hashes. The global `sr-only` and `skip-link` helpers remain standalone names, outside component modules.

Retain `html { font-size: 62.5%; }`, `rem` typography and lengths, unitless line heights, and percentage/fractional layout values where appropriate. Fonts remain in `assets/fonts`, loaded through `next/font/local` in the root layout.

A component must not import another component’s Sass Module to reach its private classes. Pass an explicit class through a component API when composition needs it, as the compact combobox does through `FormField.className`.

Preserve shadow-based control borders and focus effects, neutral hover fills, yellow primary states, errors, disabled states, focus visibility, and reduced motion. Review intentional visual changes separately from structural moves.

## Verification and references

Run lint, formatting checks, Playwright, and a production build. Browser tests cover responsive widths, accessibility, selection controls, modal focus, search/filter flows, and signup failure/retry. Compare desktop/mobile screenshots when moving Sass because stylesheet order can affect composed components.

The installed guides in `node_modules/next/dist/docs/` are the version-specific reference. These conventions also draw on:

- [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure): `src`, private folders, colocation, and route filenames.
- [Vercel Commerce components](https://github.com/vercel/commerce/tree/main/components): domain grouping alongside shared UI and layout.
- [Cal.diy packages](https://github.com/calcom/cal.diy/tree/main/packages): separate feature, UI, and library ownership at larger scale.
- [Thinking in React](https://react.dev/learn/thinking-in-react): component responsibilities and minimal state.
- [React custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks): shared behavior with independent state.

Kebab-case filenames, component folders, named exports, and these ownership boundaries are SilicaFlights conventions, not framework requirements.
