# Motion and scrolling

The landing page uses continuous scrolling with staged entrances and desktop artwork parallax. The design, content, and document flow stay intact. Shared controls also demonstrate their interactions on `/design-system`, which keeps native scrolling.

## Ownership

- `lib/motion.js` registers GSAP, ScrollTrigger, and the React hook and provides the shared easing and media queries.
- `ScrollProvider` belongs to the landing route layout. Its context exposes `scrollTo(target, { immediate, offset, focus })` and `lockScroll()`, which returns an idempotent unlock callback. Components outside the provider receive native scrolling and the same reference-counted body lock.
- `LandingMotion` owns page choreography through explicit `data-hero-reveal`, `data-motion-reveal`, `data-motion-group`, and `data-motion-artwork` hooks. CSS Module hashes are never animation selectors. Server-rendered content is visible before enhancement and when JavaScript is unavailable.
- Modal and tab transitions belong to those UI components. Simple card, dropdown, picker, and status effects stay in their Sass modules.

## Timing and behavior

Hero entrances overlap at 150ms intervals and finish in 1.25 seconds. Section entrances use 800ms and up to 3.2rem of movement, with 100ms card stagger. Both use `power3.out`. Entrances complete immediately when their container receives focus; direct hashes and restored scroll positions skip the hero sequence.

Desktop artwork travels between -2rem and 2rem with a 600ms scroll scrub. Dedicated clipped image layers provide overscan without clipping form popovers. Destination card images zoom to 1.04 and the card lifts 0.3rem over 300ms; CSS `translate` is separate from GSAP's reveal transform.

Dialogs enter in 240ms and exit in 160ms, keeping their child tree and scroll lock until closing completes. The dialog itself only fades; its inner content moves so the fixed nested-popup host remains untransformed. Reopening cancels the pending exit. Tab panels and feedback fade over 180ms; selection and focus are immediate.

Lenis uses one GSAP ticker callback, `lerp: 0.1`, normal wheel distance, and ScrollTrigger synchronization. Touch scroll stays native. Every instance, callback, media query, and ScrollTrigger is cleaned up on unmount. Anchor navigation respects scroll margin/padding and field focus; skip links stay immediate. Dialogs stop Lenis, and nested scroll regions use `data-lenis-prevent`.

## Accessibility and responsive behavior

Small-screen entrances use 1.6rem movement, 550ms duration, and a shorter hero sequence. Parallax is only enabled at desktop sizes with a fine pointer. Reduced motion removes smoothing, parallax, and JS entrances, including when the OS preference changes while the page is open; CSS respects the existing global reduced-motion rule. Focus indicators, disabled states, the white/black tab hover, and the selected yellow underline are preserved.

## Verification

Run `npm run lint`, `npm run format:check`, `npm test`, and `npm run build`. The motion suite covers scroll targets and focus, nested scrolling, dialog locks, rapid tab changes, repeated opening/closing, live reduced-motion changes, and browser navigation. Desktop/mobile captures and WebM recordings are written to Playwright's ignored `test-results` folder for visual review.
