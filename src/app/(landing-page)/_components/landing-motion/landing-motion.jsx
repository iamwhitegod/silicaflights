'use client';

import { useRef } from 'react';
import { gsap, useGSAP, ScrollTrigger, motion } from '@/lib/motion';

/** Page-only choreography; the server-rendered children stay visible without JS. */
export function LandingMotion({ children }) {
  const root = useRef(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      const entered = new WeakSet();
      media.add(
        {
          reduce: motion.reduce,
          animate: '(prefers-reduced-motion: no-preference)',
          desktop: motion.desktop,
          mobile: motion.mobile,
        },
        (context) => {
          if (context.conditions.reduce) return;
          const { mobile, desktop } = context.conditions;
          const select = gsap.utils.selector(root);
          const distance = mobile ? '1.6rem' : '3.2rem';
          const duration = mobile ? 0.55 : 0.8;
          const animations = new Map();
          const reveal = (element, delay = 0, trigger = true) => {
            if (entered.has(element)) return;
            const animation = gsap.from(element, {
              opacity: 0,
              y: distance,
              duration,
              delay,
              ease: motion.ease,
              clearProps: 'opacity,transform',
              onComplete: () => entered.add(element),
              ...(trigger
                ? { scrollTrigger: { trigger: element, start: 'top 92%', once: true } }
                : {}),
            });
            animations.set(element, animation);
          };
          // Deep links and restored positions do not replay the opening sequence.
          if (!window.location.hash && window.scrollY < 40) {
            select('[data-hero-reveal]').forEach((element, index) =>
              reveal(element, index * (mobile ? 0.1 : 0.15), false),
            );
          }
          select('[data-motion-reveal]').forEach((element) => reveal(element));
          select('[data-motion-group]').forEach((group) => {
            [...group.children].forEach((element, index) =>
              reveal(element, (index % (mobile ? 1 : 3)) * 0.1),
            );
          });
          let pointerDown = false;
          const pointerStart = () => {
            pointerDown = true;
          };
          const pointerEnd = () => {
            pointerDown = false;
          };
          const revealFocused = (event) => {
            for (const [element, animation] of animations) {
              if (element.contains(event.target)) animation.progress(1);
            }
          };
          const focus = (event) => {
            // Moving a target between pointerdown and pointerup would cancel its click.
            if (!pointerDown) revealFocused(event);
          };
          root.current.addEventListener('focusin', focus);
          root.current.addEventListener('click', revealFocused);
          document.addEventListener('pointerdown', pointerStart, true);
          document.addEventListener('pointerup', pointerEnd, true);
          document.addEventListener('pointercancel', pointerEnd, true);
          if (desktop) {
            select('[data-motion-artwork]').forEach((element) => {
              const scene = element.parentElement;
              gsap.fromTo(
                element,
                { y: '-2rem' },
                {
                  y: '2rem',
                  ease: 'none',
                  scrollTrigger: {
                    trigger: scene,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.6,
                  },
                },
              );
            });
          }
          // Refreshing mid-scroll interrupts the browser's native smooth scroll on touch devices.
          const refreshTimer = gsap
            .delayedCall(0.2, () => {
              if (ScrollTrigger.isScrolling()) refreshTimer.restart(true);
              else ScrollTrigger.refresh();
            })
            .pause();
          const refresh = () => refreshTimer.restart(true);
          const images = [...root.current.querySelectorAll('img')];
          images.forEach((image) => image.addEventListener('load', refresh));
          let active = true;
          document.fonts.ready.then(() => {
            if (active) refresh();
          });
          const node = root.current;

          return () => {
            active = false;
            node.removeEventListener('focusin', focus);
            node.removeEventListener('click', revealFocused);
            document.removeEventListener('pointerdown', pointerStart, true);
            document.removeEventListener('pointerup', pointerEnd, true);
            document.removeEventListener('pointercancel', pointerEnd, true);
            images.forEach((image) => image.removeEventListener('load', refresh));
          };
        },
      );

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} data-landing-motion>
      {children}
    </div>
  );
}
