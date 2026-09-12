'use client';
import { useId } from 'react';
import { IconButton } from '@/components/ui/icon-button/icon-button';
import { Input } from '@/components/ui/input/input';
import { FormField } from '@/components/ui/form-field/form-field';
import styles from './number-stepper.module.scss';

export function NumberStepper({ label, value, onValueChange, min = 0, max = 9 }) {
  const id = useId();
  return (
    <FormField id={id} label={label}>
      <div className={styles['number-stepper']}>
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            onValueChange(Math.min(max, Math.max(min, Number.isFinite(next) ? next : min)));
          }}
        />
        <IconButton
          label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onValueChange(value - 1)}
        >
          −
        </IconButton>
        <IconButton
          label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onValueChange(value + 1)}
        >
          +
        </IconButton>
      </div>
    </FormField>
  );
}
