'use client';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/motion';
import { lockPageScroll, nativeScrollTo, scrollDestination } from '@/lib/page-scroll';

const ScrollContext = createContext({ scrollTo: nativeScrollTo, lockScroll: lockPageScroll });

export function usePageScroll() {
  return useContext(ScrollContext);
}

/** Owns one window scroller; nested UI keeps its native scrolling. */
export function ScrollProvider({ children }) {
  const instance = useRef(null);
  const locks = useRef(new Set());
  const api = useMemo(
    () => ({
      scrollTo(target, options = {}) {
        const destination = scrollDestination(target, options.offset);
        if (!destination) return;
        if (instance.current) {
          instance.current.scrollTo(destination.top, { immediate: options.immediate });
          options.focus?.focus({ preventScroll: true });
        } else nativeScrollTo(target, options);
      },
      lockScroll() {
        const releasePage = lockPageScroll();
        const token = Symbol('scroll lock');
        locks.current.add(token);
        instance.current?.stop();
        return () => {
          if (!locks.current.delete(token)) return;
          releasePage();
          if (!locks.current.size) instance.current?.start();
        };
      },
    }),
    [],
  );

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add(`(prefers-reduced-motion: no-preference) and (pointer: fine)`, () => {
      const lenis = new Lenis({
        autoRaf: false,
        lerp: 0.1,
        wheelMultiplier: 1,
        syncTouch: false,
        anchors: false,
      });
      instance.current = lenis;
      if (locks.current.size) lenis.stop();
      const tick = (time) => lenis.raf(time * 1000);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      const restore = () => lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      window.addEventListener('pageshow', restore);
      window.addEventListener('popstate', restore);
      return () => {
        window.removeEventListener('pageshow', restore);
        window.removeEventListener('popstate', restore);
        gsap.ticker.remove(tick);
        lenis.off('scroll', ScrollTrigger.update);
        lenis.destroy();
        instance.current = null;
        gsap.ticker.lagSmoothing(500, 33);
      };
    });
    // Existing hash links remain links; only their scroll is enhanced.
    const anchor = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = event.target.closest('a[href^="#"]');
      if (!link || link.target || link.hasAttribute('download')) return;
      if (link.classList.contains('skip-link')) {
        instance.current?.scrollTo(window.scrollY, { immediate: true });
        return;
      }
      const id = decodeURIComponent(link.hash.slice(1));
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      history.pushState(null, '', link.hash);
      api.scrollTo(target);
    };
    document.addEventListener('click', anchor);
    return () => {
      document.removeEventListener('click', anchor);
      media.revert();
    };
  }, [api]);

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}
