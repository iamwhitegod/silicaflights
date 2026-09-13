'use client';
import { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input/input';
import { FormField } from '@/components/ui/form-field/form-field';
import { cx } from '@/lib/cx';
import styles from './combobox.module.scss';

/** @typedef {{value: string, label: string, detail?: string}} SelectOption */

/**
 * Controlled selection; free text filters options but does not commit a value.
 * @param {{label: string, options: SelectOption[], value: string,
 *   onValueChange: (value: string) => void, error?: string, hint?: string,
 *   placeholder?: string, id?: string, compact?: boolean,
 *   disabled?: boolean, required?: boolean}} props
 */
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
  loadOptions,
}) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState({ query: '', options: [], error: '' });
  const [retry, setRetry] = useState(0);
  const searching = !!loadOptions && open && query.trim().length >= 2;
  const loading = searching && remote.query !== query;
  const available = searching && remote.query === query && !remote.error ? remote.options : options;
  const filtered = available.filter((option) =>
    `${option.label} ${option.detail || ''}`.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = options.find((option) => option.value === value);
  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const next = await loadOptions(query.trim(), controller.signal);
        if (!controller.signal.aborted) setRemote({ query, options: next, error: '' });
      } catch (error) {
        if (!controller.signal.aborted)
          setRemote({
            query,
            options: [],
            error: error.message || 'Search unavailable. Try again.',
          });
      }
    }, 300);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, searching, loadOptions, retry]);
  useEffect(() => {
    if (open)
      document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, id]);
  function choose(option) {
    onValueChange(option.value, option);
    setQuery('');
    setOpen(false);
    setActive(0);
  }
  return (
    <div
      className={cx(styles['combobox'], compact && styles['combobox--compact'])}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setQuery('');
        }
      }}
    >
      <FormField
        className={compact ? styles['combobox__field'] : undefined}
        label={label}
        id={id}
        error={error}
        hint={hint}
        required={required}
      >
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
          maxLength={100}
          aria-busy={loading || undefined}
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
        <div className={styles['combobox__popover']} data-lenis-prevent>
          <p className={styles['combobox__suggestion-label']}>
            {query ? 'Matching places' : 'Popular places'}
          </p>
          <ul
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            className={styles['combobox__options']}
          >
            {filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={cx(
                  styles['combobox__option'],
                  index === active && styles['combobox__option--highlighted'],
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {option.detail && <small>{option.detail}</small>}
              </li>
            ))}
          </ul>
          {loading && (
            <p className={styles['combobox__empty']} role="status">
              Searching airports…
            </p>
          )}
          {searching && remote.query === query && remote.error && (
            <div className={styles['combobox__empty']} role="status">
              <p>{remote.error}</p>
              <button
                type="button"
                onClick={() => {
                  setRemote({ query: '', options: [], error: '' });
                  setRetry((value) => value + 1);
                }}
              >
                Retry airport search
              </button>
            </div>
          )}
          {!filtered.length && !loading && !(searching && remote.error) && (
            <p className={styles['combobox__empty']} role="status">
              No matching places. Try another city.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
