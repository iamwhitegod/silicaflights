'use client';
import { useEffect, useId, useRef } from 'react';
import { IconButton } from '@/components/atoms/controls';
import { Heading, Text } from '@/components/atoms/typography';
import s from './molecules.module.scss';

export default function Modal({ open, onOpenChange, title, description, children }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    const previouslyFocused = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={s.modal}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
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
      <div className={s.modalHeader}>
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
      {open && children}
    </dialog>
  );
}
