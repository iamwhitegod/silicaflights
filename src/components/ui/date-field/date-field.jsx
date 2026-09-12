'use client';
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar/calendar';
import { formatDateValue } from '@/components/ui/calendar/date-values';
import { PickerPopover } from '@/components/ui/picker-popover/picker-popover';

/**
 * Date-only selection; value/min/max use YYYY-MM-DD, and clearing emits ''.
 * @param {{value?: string, defaultValue?: string, onValueChange?: (value: string) => void,
 *   min?: string, max?: string, label: string, id?: string, name?: string, hint?: string,
 *   error?: string, disabled?: boolean, readOnly?: boolean, required?: boolean,
 *   compact?: boolean, className?: string}} props
 */
export function DateField({ value, defaultValue = '', onValueChange, min, max, ...props }) {
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
      icon="calendar"
      value={currentValue}
      displayValue={formatDateValue(currentValue)}
      placeholder="Select date"
      open={open}
      onOpenChange={setOpen}
    >
      {open && (
        <Calendar
          label={props.label}
          value={currentValue}
          min={min}
          max={max}
          onValueChange={choose}
        />
      )}
    </PickerPopover>
  );
}
