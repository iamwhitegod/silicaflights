'use client';
import { memo, useEffect, useId, useRef, useState } from 'react';
import { UNSAFE_PortalProvider } from 'react-aria/PortalProvider';
import { IconButton } from '@/components/ui/icon-button/icon-button';
import { Heading } from '@/components/ui/heading/heading';
import { Text } from '@/components/ui/text/text';
import { usePageScroll } from '@/components/ui/scroll-provider/scroll-provider';
import { gsap, useGSAP, motion } from '@/lib/motion';
import styles from './modal.module.scss';

// Parents may clear their result/draft at close; retain the last open content until exit ends.
const ModalContent = memo(
  function ModalContent({ children }) {
    return children;
  },
  (_previous, next) => !next.open,
);

/**
 * Controlled native dialog. Closing restores focus to the opening element.
 * @param {{open: boolean, onOpenChange: (open: boolean) => void,
 *   title: string, description?: string, children: import('react').ReactNode}} props
 */
export function Modal({ open, onOpenChange, title, description, children }) {
  const ref = useRef(null);
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const releaseRef = useRef(null);
  const openerRef = useRef(null);
  const [present, setPresent] = useState(open);
  const { lockScroll } = usePageScroll();
  const id = useId();
  // Keep child state through the exit; start a fresh child tree after a completed close.
  if (open && !present) setPresent(true);
  useGSAP(
    () => {
      const dialog = ref.current;
      if (!open && !dialog.open) return;
      if (open && !dialog.open) {
        openerRef.current = document.activeElement;
        releaseRef.current = lockScroll();
        dialog.showModal();
      }
      const finish = () => {
        dialog.close();
        releaseRef.current?.();
        releaseRef.current = null;
        if (openerRef.current?.isConnected) openerRef.current.focus({ preventScroll: true });
        setPresent(false);
      };
      const media = gsap.matchMedia();
      media.add(
        { reduce: motion.reduce, animate: '(prefers-reduced-motion: no-preference)' },
        (context) => {
          if (context.conditions.reduce) {
            if (!open) finish();
            return;
          }
          if (open) {
            gsap.fromTo(
              dialog,
              { opacity: 0 },
              { opacity: 1, duration: 0.24, clearProps: 'opacity' },
            );
            gsap.fromTo(
              contentRef.current,
              { y: '0.8rem' },
              { y: 0, duration: 0.24, ease: motion.ease, clearProps: 'transform' },
            );
          } else {
            gsap.to(dialog, { opacity: 0, duration: 0.16, onComplete: finish });
          }
        },
      );
      return () => media.revert();
    },
    { scope: ref, dependencies: [open, lockScroll], revertOnUpdate: true },
  );
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      dialog.close();
      releaseRef.current?.();
      releaseRef.current = null;
      if (openerRef.current?.isConnected) openerRef.current.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles['modal']}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onKeyDown={(event) => {
        // A nested picker owns its own focus scope until it closes.
        if (
          event.defaultPrevented ||
          event.key !== 'Tab' ||
          event.currentTarget.querySelector('[data-picker-popover]')
        )
          return;
        const focusable = [
          ...event.currentTarget.querySelectorAll(
            'button, a[href], input, select, textarea, [tabindex]',
          ),
        ].filter(
          (element) =>
            !element.matches(':disabled') &&
            element.tabIndex >= 0 &&
            element.getClientRects().length,
        );
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (event.currentTarget.querySelector('[data-picker-popover]')) return;
        onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onOpenChange(false);
        }
      }}
    >
      <div className={styles['modal__viewport']} data-lenis-prevent>
        <div ref={contentRef} className={styles['modal__content']}>
          <div className={styles['modal__header']}>
            <Heading level={2} variant="small" tone="default" id={`${id}-title`}>
              {title}
            </Heading>
            <IconButton label={`Close ${title}`} icon="close" onClick={() => onOpenChange(false)} />
          </div>
          {description && (
            <Text size="label" tone="muted" id={`${id}-description`}>
              {description}
            </Text>
          )}
          {/* Popups must remain inside the native dialog's top layer, outside its scrolling viewport. */}
          <UNSAFE_PortalProvider getContainer={() => overlayRef.current}>
            {present && <ModalContent open={open}>{children}</ModalContent>}
          </UNSAFE_PortalProvider>
        </div>
      </div>
      <div ref={overlayRef} className={styles['modal__overlays']} />
    </dialog>
  );
}
