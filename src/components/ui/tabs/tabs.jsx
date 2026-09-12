'use client';
import { useId, useRef } from 'react';
import { gsap, useGSAP, motion } from '@/lib/motion';
import styles from './tabs.module.scss';

/**
 * @param {{label: string, items: {value: string, label: string,
 *   content: import('react').ReactNode, disabled?: boolean}[], value: string,
 *   onValueChange: (value: string) => void}} props
 */
export function Tabs({ label, items, value, onValueChange }) {
  const id = useId();
  const root = useRef(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          root.current.querySelector('[role="tabpanel"]:not([hidden])'),
          { opacity: 0 },
          { opacity: 1, duration: 0.18, ease: motion.ease, clearProps: 'opacity' },
        );
      });
      return () => media.revert();
    },
    { scope: root, dependencies: [value], revertOnUpdate: true },
  );
  return (
    <div ref={root} className={styles['tabs']}>
      <div
        role="tablist"
        aria-label={label}
        className={styles['tabs__list']}
        onKeyDown={(event) => {
          const enabled = items.filter((item) => !item.disabled);
          const index = enabled.findIndex((item) => item.value === value);
          const next =
            event.key === 'ArrowRight'
              ? enabled[(index + 1) % enabled.length]
              : event.key === 'ArrowLeft'
                ? enabled[(index - 1 + enabled.length) % enabled.length]
                : event.key === 'Home'
                  ? enabled[0]
                  : event.key === 'End'
                    ? enabled.at(-1)
                    : null;
          if (next) {
            event.preventDefault();
            onValueChange(next.value);
            document.getElementById(`${id}-tab-${next.value}`)?.focus();
          }
        }}
      >
        {items.map((item) => (
          <button
            type="button"
            role="tab"
            id={`${id}-tab-${item.value}`}
            key={item.value}
            disabled={item.disabled}
            tabIndex={item.value === value ? 0 : -1}
            aria-selected={item.value === value}
            aria-controls={`${id}-panel-${item.value}`}
            onClick={() => onValueChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.value}
          role="tabpanel"
          id={`${id}-panel-${item.value}`}
          aria-labelledby={`${id}-tab-${item.value}`}
          hidden={value !== item.value}
          tabIndex={0}
          className={styles['tabs__panel']}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
