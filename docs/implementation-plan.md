# SilicaFlights: design system first, responsive website second

Implementation status: both phases are implemented. See [design-system.md](design-system.md) for component contracts, local preview commands, asset provenance, and design refinements. Verification: 16 browser tests passed, lint and formatting checks passed, production build passed, and production routes returned `/` → 200 and `/design-system` → 404.

## Summary

Build in two phases using Next.js, JavaScript, and Sass Modules. Follow Brad Frost’s Atomic Design hierarchy: atoms, molecules, organisms, templates, and pages. Components should have focused responsibilities and be validated in larger compositions. [Atomic Design methodology](https://atomicdesign.bradfrost.com/chapter-2/)

Preserve the reviewed Figma identity while correcting accessibility issues, inconsistent copy, and incomplete states. Scope remains a landing page with clearly labeled demo interactions, without backend integrations.

Design references:

- [Landing page](https://www.figma.com/design/JtXEWl1sQDdd8KI5yVK9NO/SilicaFlights?node-id=380-2)
- [Resources and components](https://www.figma.com/design/JtXEWl1sQDdd8KI5yVK9NO/SilicaFlights?node-id=596-4424)
- Reviewed desktop frame: `413:2653`; mobile frame: `458:470`.

## Phase 1 — Design system

### Foundations and Sass

- Install `sass`; replace starter styles with global SCSS and component-scoped `.module.scss`.
- Organize Sass foundations into tokens, base styles, and mixins. Use `@use` and `@forward`; avoid deprecated Sass imports.
- Keep semantic design tokens as CSS custom properties. Use Sass maps and mixins for compile-time utilities and breakpoints.
- Set `html { font-size: 62.5%; }` and body text to `1.6rem`. At the standard browser default, `1rem` corresponds to 10px while respecting user font preferences.
- Express typography and dimensional lengths in `rem`: spacing, padding, gaps, widths, heights, borders, radii, shadows, icon sizes, and offsets. Use unitless line-height, `%` for proportional sizing, and `fr` for grids. Do not author pixel-based CSS lengths.
- Media-query `rem` units resolve against the browser’s initial font size, not the declared root size. Use `48rem` and `64rem` for the intended 768px and 1024px breakpoints at default browser settings.

### Fonts and tokens

Load the supplied fonts directly from `assets` through `next/font/local`, with accurate weight mappings and no synthetic weights.

| Foundation            | Specification                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Display font          | Recoleta Alt Bold for hero and section headings.                                                                 |
| Body font             | Switzer Regular, Medium, Semibold, and Bold for body, controls, cards, and branding. Switzer replaces Mona Sans. |
| Decorative font       | Cintarini Regular for the footer tagline only.                                                                   |
| Display sizes         | Hero: `5.6rem` desktop / `3.2rem` mobile. Sections: `4.8rem` / `3.2rem`. Card headings: `2.4rem`.                |
| Supporting sizes      | Body `1.6rem`, labels `1.4rem`, captions `1.2rem`.                                                               |
| Brand palette         | Yellow `#FCCB5F`; named blue `#4F86FD`; heading/focus blue `#0089FC`; source selection blue `#437EFD`.           |
| Accessible actions    | Dark blue `#0045D7` for small links and selected controls with white text.                                       |
| Neutrals              | White, surface `#F5F5F5`, primary text `#1E1E1E`, secondary `#444444`, muted `#777777`, placeholders `#666666`.  |
| Feature surfaces      | Cream `#FFFDEA`, mint `#E6FBF4`, peach `#FFEADB`.                                                                |
| Added feedback tokens | Error `#B42318` / `#FEF3F2`; success `#166534` / `#F0FDF4`.                                                      |
| Spacing scale         | `0.4`, `0.8`, `1.2`, `1.6`, `2`, `2.4`, `3.2`, `4`, `4.8`, `6.4`, `8`, `9.6rem`.                                 |
| Shape                 | Radii `1rem`, `2rem`, `3rem`, and pill; standard border `0.1rem`.                                                |
| Controls              | Heights `4.8rem`, `5.2rem`, `6rem`; icons `1.6rem`, `2rem`, `2.4rem`.                                            |
| Effects               | Named glass, inset highlight, elevation, backdrop, and focus-ring tokens.                                        |
| Motion                | 150ms controls; 200ms overlays; reduced-motion support.                                                          |

Document each token’s purpose and Figma origin. Distinguish extracted values from accessibility refinements.

### Atomic component architecture

Organize reusable components by responsibility, with colocated Sass Modules.

| Level         | Components                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Atoms**     | Heading, Text, Label, Button, IconButton, Link, Input, Icon, Image, Spinner, and supporting status text.                                 |
| **Molecules** | FormField, SearchField, DateField, NumberStepper, Combobox, Chip, Tabs, SegmentedControl, FeatureCard, DestinationCard, and modal shell. |
| **Organisms** | Navigation, FlightSearchForm, AdvancedSearchDialog, FounderSignupForm, WeeklyDealsForm, feature grid, destination grid, and Footer.      |
| **Templates** | Define the landing-page section structure and content slots; final composition happens in Phase 2.                                       |
| **Pages**     | Build the development-only design-system showcase in Phase 1; populate the landing template in Phase 2.                                  |

Atoms remain independent of flight-specific business logic. Molecules compose atoms; organisms own feature interactions. Shared layout primitives provide containers, stacks, grids, and sections.

### States and interfaces

- Buttons: default, hover, pressed, focus-visible, disabled, loading, and success.
- Fields: empty, hover, focused, filled, invalid, disabled, and read-only.
- Selection controls: unselected, selected, hover, focus-visible, and disabled.
- Comboboxes: closed, open, populated, empty results, and selected.
- Forms: idle, invalid, submitting, demo success, simulated failure, and retry.
- Modals: open/closed, keyboard dismissal, focus containment/restoration, and background scroll lock.

Reserve border space so focus and errors never change control dimensions. Preserve visible keyboard focus alongside error and selection styling.

Public interfaces:

- `Heading`: semantic level separate from visual variant.
- `Button`: `variant`, `size`, `loading`, `disabled`, and native button props.
- Fields: native input props, controlled value/change callback, label, hint, and error.
- Selection components: `value` and `onValueChange`.
- Modal: `open`, `onOpenChange`, title, and description.
- Forms: asynchronous `onSubmit(values)` callback, keeping service integration separate from presentation.

### Phase 1 completion criteria

Deliver `/design-system` in development with tokens, typography samples, assets, components, states, and composed organisms.

Verify keyboard behavior, accessible labels, contrast, validation announcements, disabled/loading behavior, and focus handling. Components must tolerate narrow containers, long content, and increased text size before page assembly starts.

Run lint, production build, and focused component interaction tests.

## Phase 2 — Responsive landing page

### Composition and assets

Assemble the page exclusively from the established system:

1. Navigation and illustrated hero.
2. Flight search and advanced-search dialog.
3. Three “How it works” cards.
4. Six destination cards.
5. Founder signup.
6. Weekly flight-deals subscription.
7. Illustrated footer and destination links.

Export and commit the original Figma assets with descriptive names and source-node references. Preserve desktop/mobile artwork crops, keep meaningful text in HTML, and explicitly size images to prevent layout shifts.

Use Switzer consistently for card headings and branding. Correct obvious copy errors and retain all six destinations on mobile.

### Responsive rules

- Below `48rem`: stacked search, single-column cards, full-width forms, compact dialog layout.
- From `48rem`: two-column destination grid.
- From `64rem`: horizontal search and three-column card grids.
- Content width caps at `128.9rem`; search at `91.2rem`; forms at `59.4rem`.
- Mobile gutters are `2.4rem`; standard section padding is `4.8rem` mobile and `9.6rem` desktop.
- Use flexible grids, wrapping, and content-driven heights. Absolute positioning is reserved for decorative artwork.
- Adapt typography through shared responsive tokens rather than page-specific overrides.

### Interaction behavior

- “Join Founders” scrolls to and focuses the founder form.
- Destination cards and footer links prefill the destination field and focus search.
- Flight search validates required airports, different origin/destination, and future dates; valid submission opens a labeled demo summary.
- Advanced settings provide flight details, price, schedule, and traveler tabs. Apply commits draft values; Cancel discards them; Clear resets the draft.
- Defaults: one-way, economy, one adult, no optional filters. Multi-city remains visibly disabled with an explanation.
- Founder signup requires valid email. Weekly deals requires name and email; location preferences are optional.
- Demo submissions remain in memory, prevent duplicate activation, and explicitly state that no information was sent. The showcase exposes success/failure scenarios.
- Prices and founder availability are labeled sample content. No live location detection or flight availability is implied.

### Phase 2 completion criteria

- Compare against Figma at 1445px desktop and 393px mobile; additionally test 320px, 768px, and 1024px viewports.
- Verify 200% zoom and enlarged browser default fonts, without clipped content or horizontal overflow.
- Test invalid forms, airport selection, date/range errors, traveler minimums, tabs, modal dismissal, chip removal, and retry behavior.
- Run automated accessibility checks and manual keyboard/contrast review over illustrated backgrounds.
- Run lint, production build, and focused browser tests.
- Replace starter metadata and automatic dark-mode styling. Keep static sections server-rendered and interactive organisms client-rendered.
- Record intentional Figma refinements in the design-system documentation.

Deployment, live booking, payments, and email services remain outside these two phases.
