'use client';

import { useId } from 'react';
import { cx } from '@/lib/cx';
import styles from './segmented-control.module.scss';

export function SegmentedControl({ label, options, value, onValueChange }) {
  const id = useId();

  return (
    <fieldset className={styles['segmented-control']}>
      <legend>{label}</legend>
      <div className={styles['segmented-control__options']}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cx(
              styles['segmented-control__option'],
              option.disabled && styles['segmented-control__option--disabled'],
            )}
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onValueChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
