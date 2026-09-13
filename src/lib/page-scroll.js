let lockCount = 0;
let originalOverflow = '';

/** Returns an idempotent release function, including for overlapping dialogs. */
export function lockPageScroll() {
  if (lockCount++ === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  let released = false;

  return () => {
    if (released) return;
    released = true;
    if (--lockCount === 0) document.body.style.overflow = originalOverflow;
  };
}

export function scrollDestination(target, offset) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return null;
  const inset =
    offset ??
    (parseFloat(getComputedStyle(element).scrollMarginTop) || 0) +
      (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);

  return { element, top: element.getBoundingClientRect().top + window.scrollY - inset };
}

export function nativeScrollTo(target, { immediate = false, offset, focus } = {}) {
  const destination = scrollDestination(target, offset);
  if (!destination) return;
  window.scrollTo({
    top: destination.top,
    behavior:
      immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
  });
  focus?.focus({ preventScroll: true });
}
