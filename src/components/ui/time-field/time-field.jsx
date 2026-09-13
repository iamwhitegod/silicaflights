'use client';

import { useState } from 'react';
import { PickerPopover } from '@/components/ui/picker-popover/picker-popover';
import { TimeOptions } from './time-options';

/**
 * 24-hour selection. Done commits HH:mm; Clear commits ''; dismissal discards the draft.
 * @param {{value?: string, defaultValue?: string, onValueChange?: (value: string) => void,
 *   label: string, id?: string, name?: string, hint?: string, error?: string,
 *   disabled?: boolean, readOnly?: boolean, required?: boolean, className?: string}} props
 */
export function TimeField({ value, defaultValue = '', onValueChange, ...props }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const currentValue = value === undefined ? internalValue : value;

  function choose(next) {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
    setOpen(false);
  }

  return (
    <PickerPopover
      {...props}
      icon="clock"
      value={currentValue}
      displayValue={currentValue}
      placeholder="HH:mm"
      open={open}
      onOpenChange={setOpen}
    >
      {open && <TimeOptions initialValue={currentValue} onCommit={choose} />}
    </PickerPopover>
  );
}
