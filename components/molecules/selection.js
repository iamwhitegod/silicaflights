'use client';
import { useId } from 'react';
import { cx } from '@/lib/cx';
import s from './molecules.module.scss';

export function SegmentedControl({ label, options, value, onValueChange }) {
  const id = useId();
  return (
    <fieldset className={s.segmented}>
      <legend>{label}</legend>
      <div className={s.segments}>
        {options.map((option) => (
          <label key={option.value} className={cx(s.segment, option.disabled && s.disabled)}>
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
export function Tabs({ label, items, value, onValueChange }) {
  const id = useId();
  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className={s.tabs}
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
          className={s.tabPanel}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
