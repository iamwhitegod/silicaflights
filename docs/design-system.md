# SilicaFlights design system

The implementation follows the two-phase plan in [implementation-plan.md](implementation-plan.md). The component showcase is available at `/design-system` during development; production returns 404 for this route.

[Motion and scrolling](motion.md) documents the GSAP choreography, Lenis integration, responsive behavior, and motion verification workflow.

## Run and verify

```sh
npm install
npm run dev
npm run lint
npm test
npm run build
```

Browser tests use Google Chrome through Playwright. The test runner reuses the development server on `http://localhost:3000`, or starts it when necessary. Landing-page screenshots are written to `/tmp/silicaflights-preview`; test traces and showcase screenshots are in the ignored `test-results` directory.

## Foundations

`src/styles/_tokens.scss` defines semantic CSS properties. `src/styles/_mixins.scss` defines responsive and focus mixins, exported through `src/styles/_index.scss`. Global resets and local font variables are applied in the root layout.

- Root font size is `62.5%`; the browser’s usual default makes `1rem` equivalent to 10px. The body is `1.6rem`. User font preferences still scale the interface.
- All authored CSS lengths use `rem`, apart from proportional percentages and grid fractions. Line heights are unitless. Intrinsic HTML image dimensions and image `sizes` descriptors are not CSS layout tokens.
- Media-query `rem` uses the browser’s initial font size: tablet starts at `48rem`, desktop at `64rem` (768px/1024px at standard browser defaults).
- Recoleta Alt Bold supplies display headings. Switzer 400/500/600/700 supplies body text, controls, card headings, and branding. Cintarini 400 supplies the footer tagline. Fonts are served locally from `assets/fonts` using `next/font/local`.
- The original heading blue, brand blue, selection blue, yellow, and pastel surfaces remain source tokens. Accessible action blue, darker placeholder text, and feedback colors are deliberate refinements. Small action text must use `--color-action`, not `--color-sky`.
- Control sizes are minimum heights. Text and errors may increase component height. Input states use inset shadows and a soft outer focus glow, with no visible border or browser outline; compound fields draw this treatment on their outer surface only.

## Atomic hierarchy

| Level     | Responsibility                                    | Examples                                                                                                                             |
| --------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Atoms     | Typography, native controls, assets, and feedback | Heading, Text, Label, Button, Input, Link, Icon, Image, Artwork, Status                                                              |
| Molecules | A focused combination of atoms                    | TextField, Combobox, MultiSelect, DateField, TimeField, Calendar, PickerPopover, NumberStepper, Tabs, SegmentedControl, Modal, cards |
| Organisms | A complete interaction or page section            | FlightSearchForm, AdvancedSearchDialog, signup forms, Navigation, content grids, Footer                                              |
| Templates | Arrange organisms into a content structure        | LandingPage                                                                                                                          |
| Pages     | Provide route-specific content and examples       | Home route and development DesignSystem page                                                                                         |

Static content, cards, grids, the footer, and the landing template remain server-renderable. Client boundaries contain form state, selection controls, navigation focus behavior, and dialogs. Shared travel data lives in `src/data`; validation and defaults live beside their domain components. `src/lib` contains generic utilities and demo adapters.

Each component with its own styles has a colocated Sass Module. Atomic levels describe composition; folders group components by ownership. See [architecture.md](architecture.md) for file locations and import rules. Use shared tokens and lower-level components before adding a new variant; do not import page styling into a reusable component.

Component classes follow BEM throughout the app and showcase: `block`, `block__element`, `block--modifier`, and `block__element--modifier`. For example, buttons combine `button`, `button--primary`, and `button--size-sm`; picker labels and values belong to `picker-popover`. Use bracket notation in JSX (`styles['picker-popover__trigger']`), retain the base class with every modifier, and keep hover/focus/ARIA/data states attached to their BEM selectors. This naming convention changes neither the public component props nor the design tokens.

## Component contracts

| Component         | Contract                                                                                                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Heading           | `level` (1–6), `variant` (`hero`, `section`, `card`, `small`), `tone`, native heading props. Visual size is independent of heading level.                                                                                                                      |
| Text              | `as`, `size` (`body`, `compact`, `label`, `caption`), `tone`, native element props.                                                                                                                                                                            |
| Button            | `variant` (`primary`, `secondary`, `neutral`, `ghost`), `size` (`sm`, `md`, `lg`), `loading`, `success`, `disabled`, native props. Defaults to `type="button"`; form submission is explicit.                                                                   |
| IconButton        | Requires `label`; accepts an exported `icon` name or text children.                                                                                                                                                                                            |
| Input / TextField | Native controlled or uncontrolled input props. `TextField` adds `label`, `hint`, `error`, and generated stable IDs.                                                                                                                                            |
| Combobox          | `options: { value, label, detail? }[]`, `value`, `onValueChange`, label, error, hint, disabled, compact. Only selected options constitute a valid value.                                                                                                       |
| MultiSelect       | Same option/value vocabulary, with an array value; excludes chosen options and provides removable chips.                                                                                                                                                       |
| DateField         | `value` / `defaultValue` as `YYYY-MM-DD` or `''`, `onValueChange(value)`, optional `min` / `max`, `label`, `hint`, `error`, `disabled`, `readOnly`, `required`, `id`, `name`, and `compact`. The displayed date is formatted separately from its stored value. |
| TimeField         | `value` / `defaultValue` as 24-hour `HH:mm` or `''`, `onValueChange(value)`, `label`, `hint`, `error`, `disabled`, `readOnly`, `required`, `id`, and `name`. Done commits the draft; Clear emits `''`.                                                         |
| Calendar          | Single-month date selection with `label`, `value`, `onValueChange`, `min`, and `max`. The field wrapper owns opening and closing.                                                                                                                              |
| PickerPopover     | Shared labeled field and popup shell with controlled `open` / `onOpenChange`, display value, icon, and feedback. Used internally by DateField and TimeField.                                                                                                   |
| SegmentedControl  | Labeled native radio group; options can be disabled.                                                                                                                                                                                                           |
| Tabs              | `items: { value, label, content, disabled? }[]`, `value`, `onValueChange`, label.                                                                                                                                                                              |
| Modal             | `open`, `onOpenChange`, `title`, optional description and content. Native modal dialog plus a keyboard focus loop and restoration.                                                                                                                             |
| Signup forms      | Async `onSubmit(values)`, optional unique `idPrefix`. Weekly values contain name, email, departures, interests; founder signup uses email.                                                                                                                     |
| FlightSearchForm  | Async `onSubmit(values)`, `initialDestination` airport code, optional unique `idPrefix`. Values contain origin, destination, departure, filters.                                                                                                               |

`onSubmit` resolves for success and throws for failure. Production service integrations must replace the demo adapter and demo copy together; the current adapter sends no requests and stores no personal data. Duplicate submissions are guarded while pending.

## Interaction and state rules

- Hover and pressed styles use CSS pseudo-classes. Neutral buttons and selection controls retain their original neutral fills and use a crisp blue inset box shadow for the border effect, with no tinted fills or hover elevation. Primary yellow buttons retain their original yellow states. Keyboard focus composes with hover and selection shadows; invalid inputs retain a red focus glow. Error and selected states do not suppress focus.
- Inputs associate hints and errors through `aria-describedby`; errors also set `aria-invalid`. Form validation focuses the first invalid field.
- Comboboxes support filtering, no matches, arrows, Enter, and Escape. Focus stays in the text input; the active option is announced through `aria-activedescendant`.
- Date fields open a calendar focused on the selected day, or today clamped to the permitted range. Selecting a day or Today commits and closes; Clear removes the date. Dates outside `min` / `max` are disabled. Arrow keys navigate days, Page Up / Down navigate months, and Enter selects. Today follows the user's local calendar date; stored date-only values never shift across time zones.
- Time fields open separate hour (`00`–`23`) and minute (`00`–`59`) lists. The draft preview updates as options change. Done commits; Escape or clicking outside discards the draft. An empty field remains empty until committed, even though its popup initially previews `00:00`. Arrow keys, Home / End, Space, and Tab support keyboard selection.
- Both pickers retain pill-shaped triggers, current-color icons, neutral hover surfaces, blue selections, and shadow-based borders/focus. Triggers use select-only combobox semantics with a dialog popup, associated values/errors, and required/read-only/invalid attributes. Enter, Space, or Arrow Down opens selection. Invalid fields keep their red focus treatment. Disabled fields cannot open; read-only values remain focusable. Optional `name` creates a hidden input for form serialization; required values are validated by the owning form.
- Tabs support Left/Right/Home/End and skip disabled tabs. Trip and cabin choices use native radio keyboard behavior.
- Dialogs lock background scrolling, contain focus, close on Escape or backdrop activation, and restore trigger focus.
- Nested picker popups close before their containing dialog and restore focus to their own trigger. Dialog content scrolls inside a viewport; a separate viewport-sized portal host keeps popups within the native dialog's top layer without clipping or dialog-margin offsets. Dialog entry uses opacity only so transforms do not change the portal's containing block.
- Advanced filters are edited in a draft. Apply validates and commits; Cancel discards; Clear resets the draft. Defaults are one-way, economy, one adult, and no optional filters. Multi-city is intentionally disabled.
- Founder signup requires email. Weekly signup requires name and email; selected locations are optional. Loading, success, failure, and retry are demonstrated in the showcase using its simulation checkbox.
- Motion respects `prefers-reduced-motion`. Controls wrap and grow for larger text instead of relying on fixed page heights.

## Assets and design refinements

`public/images/manifest.json` records the original Figma node and download URL for each asset. Files are committed locally so rendering does not depend on expiring Figma URLs. `scripts/download-assets.mjs` is a provenance/recovery helper; refresh its URLs from Figma before reuse after expiration.

Next.js optimizes content images and art-directed founder/deals illustrations. Decorative assets have empty alternative text; card link names and HTML headings carry meaning.

Intentional differences from the Figma frames:

- Switzer replaces Mona Sans as requested, using the supplied font files.
- Small white-on-blue text uses darker blue; placeholders and focus states have stronger contrast.
- Input borders no longer change height on focus.
- Both layouts show six destinations, with consistently cropped images and corrected copy.
- The destination heading does not claim location awareness. Fares and founder availability are labeled sample content.
- Signup and search outcomes explicitly identify the demo; no subscription or booking is claimed.
- Navigation is present on both desktop and mobile. Destination links prefill search through a query parameter.
- Background illustration positioning is responsive; surrounding content uses normal document flow.

## Verification coverage

Browser tests cover local fonts, focus sizing, keyboard combobox/tab/modal behavior, form validation/failure/retry, chip removal, advanced filter draft/apply/reset behavior, destination prefilling, founder focus, automated accessibility, image loading, and layout at 320, 393, 768, 1024, and 1445px. A larger-text check doubles the root size to exercise content reflow.

Picker tests additionally cover leap days, minimum/maximum dates, local Today behavior in Los Angeles and Kiritimati, midnight/end-of-day times, keyboard selection, draft dismissal, disabled/read-only/error states, nested focus restoration, and mobile popup margins. Date/time selection uses unstyled React Aria primitives and `@internationalized/date`, with local Sass Modules and existing design tokens. No Tailwind or shadcn styling layer is required.

Live fares, bookings, payments, user accounts, subscription services, geolocation, and deployment are outside this implementation.
