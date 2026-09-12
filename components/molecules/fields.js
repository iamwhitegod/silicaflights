'use client';
import { useEffect, useId, useState } from 'react';
import { Input, IconButton, Button } from '@/components/atoms/controls';
import { Label } from '@/components/atoms/typography';
import { cx } from '@/lib/cx';
import s from './molecules.module.scss';

export function FormField({ label, hint, error, id, children, required, className, action }) {
  return (
    <div className={cx(s.field, action && s.fieldWithAction, className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </Label>
      {action ? <div className={s.fieldControl}>{children}</div> : children}
      {hint && (
        <p id={`${id}-hint`} className={s.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={s.error} role="alert">
          {error}
        </p>
      )}
      {action && <div className={s.fieldAction}>{action}</div>}
    </div>
  );
}
export function TextField({ label, hint, error, id: suppliedId, action, ...props }) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      id={id}
      required={props.required}
      action={action}
    >
      <Input
        id={id}
        invalid={!!error}
        aria-describedby={
          [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
        }
        {...props}
      />
    </FormField>
  );
}
export function DateField(props) {
  return <TextField type="date" {...props} />;
}

export function Combobox({
  label,
  options,
  value,
  onValueChange,
  error,
  hint,
  placeholder = 'City or airport',
  id: suppliedId,
  compact = false,
  disabled,
  required,
}) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const filtered = options.filter((option) =>
    `${option.label} ${option.detail || ''}`.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = options.find((option) => option.value === value);
  useEffect(() => {
    if (open)
      document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, id]);
  function choose(option) {
    onValueChange(option.value);
    setQuery('');
    setOpen(false);
    setActive(0);
  }
  return (
    <div
      className={cx(s.combobox, compact && s.compact)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setQuery('');
        }
      }}
    >
      <FormField label={label} id={id} error={error} hint={hint} required={required}>
        <Input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open && filtered[active] ? `${id}-option-${active}` : undefined}
          aria-describedby={
            [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
          }
          invalid={!!error}
          disabled={disabled}
          required={required}
          autoComplete="off"
          placeholder={placeholder}
          value={open ? query : selected?.label || ''}
          onFocus={() => {
            setQuery(selected?.label || '');
            setOpen(true);
            setActive(0);
          }}
          onClick={() => {
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            onValueChange('');
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              if (open) event.stopPropagation();
              setOpen(false);
              setQuery('');
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setOpen(true);
              setActive(
                open
                  ? (active + (event.key === 'ArrowDown' ? 1 : -1) + Math.max(filtered.length, 1)) %
                      Math.max(filtered.length, 1)
                  : 0,
              );
            }
            if (event.key === 'Enter' && open) {
              event.preventDefault();
              if (filtered[active]) choose(filtered[active]);
            }
          }}
        />
      </FormField>
      {open && (
        <div className={s.popover}>
          <p className={s.suggestionLabel}>{query ? 'Matching places' : 'Popular places'}</p>
          <ul id={`${id}-list`} role="listbox" aria-label={label} className={s.options}>
            {filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={cx(s.option, index === active && s.highlighted)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {option.detail && <small>{option.detail}</small>}
              </li>
            ))}
          </ul>
          {!filtered.length && (
            <p className={s.empty} role="status">
              No matching places. Try another city.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function Chip({ children, selected, onClick, onRemove, disabled }) {
  return (
    <Button
      variant="neutral"
      size="sm"
      className={cx(s.chip, selected && s.selectedChip)}
      disabled={disabled}
      onClick={onRemove || onClick}
      aria-label={onRemove ? `Remove ${children}` : undefined}
      aria-pressed={onRemove ? undefined : !!selected}
    >
      {children}
      {onRemove && <span aria-hidden="true">×</span>}
    </Button>
  );
}
export function MultiSelect({ label, options, value, onValueChange }) {
  return (
    <div className={s.multiSelect}>
      <Combobox
        label={label}
        options={options.filter((option) => !value.includes(option.value))}
        value=""
        onValueChange={(next) => {
          if (next) onValueChange([...value, next]);
        }}
        placeholder="Search countries or cities"
      />
      {value.length > 0 && (
        <div className={s.chips} role="group" aria-label={`${label} selections`}>
          {value.map((item) => (
            <Chip
              key={item}
              selected
              onRemove={() => onValueChange(value.filter((entry) => entry !== item))}
            >
              {options.find((option) => option.value === item)?.label || item}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
export function NumberStepper({ label, value, onValueChange, min = 0, max = 9 }) {
  const id = useId();
  return (
    <FormField id={id} label={label}>
      <div className={s.stepper}>
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
