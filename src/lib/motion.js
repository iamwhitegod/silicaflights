'use client';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export { gsap, useGSAP, ScrollTrigger };

export const motion = {
  ease: 'power3.out',
  reduce: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 64rem) and (pointer: fine)',
  mobile: '(max-width: 47.999rem)',
};
