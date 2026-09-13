'use client';

import { useId } from 'react';
import { Dialog, DialogTrigger, I18nProvider, Popover, Pressable } from 'react-aria-components';
import { FormField } from '@/components/ui/form-field/form-field';
import { Icon } from '@/components/ui/icon/icon';
import { cx } from '@/lib/cx';
import styles from './picker-popover.module.scss';

/** Shared field surface and accessible popup for date/time selection. */
export function PickerPopover({
  id: suppliedId,
  label,
  hint,
  error,
  icon,
  displayValue,
  placeholder,
  value,
  name,
  required,
  disabled,
  readOnly,
  compact,
  className,
  open,
  onOpenChange,
  children,
}) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  const describedBy = [
    `${id}-value`,
    hint && `${id}-hint`,
    error && `${id}-error`,
    readOnly && `${id}-readonly`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <I18nProvider locale="en-GB">
      <FormField
        id={id}
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={cx(
          styles['picker-popover'],
          compact && styles['picker-popover--compact'],
          className,
        )}
      >
        <DialogTrigger
          isOpen={open && !disabled && !readOnly}
          onOpenChange={(next) => onOpenChange(next && !disabled && !readOnly)}
        >
          <Pressable isDisabled={disabled}>
            <button
              id={id}
              type="button"
              role="combobox"
              disabled={disabled}
              aria-label={label}
              aria-describedby={describedBy}
              aria-haspopup="dialog"
              aria-expanded={open && !disabled && !readOnly}
              aria-controls={open ? `${id}-dialog` : undefined}
              aria-invalid={!!error || undefined}
              aria-required={required || undefined}
              aria-readonly={readOnly || undefined}
              data-readonly={readOnly || undefined}
              className={styles['picker-popover__trigger']}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' && !disabled && !readOnly) {
                  event.preventDefault();
                  onOpenChange(true);
                }
              }}
            >
              <span
                id={`${id}-value`}
                className={cx(
                  styles['picker-popover__value'],
                  !displayValue && styles['picker-popover__value--placeholder'],
                )}
              >
                {displayValue || placeholder}
              </span>
              <Icon name={icon} />
            </button>
          </Pressable>
          <Popover
            placement="bottom start"
            offset={8}
            containerPadding={16}
            shouldFlip
            className={styles['picker-popover__popover']}
            data-picker-popover="true"
            data-lenis-prevent
            onKeyDownCapture={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                onOpenChange(false);
              }
            }}
          >
            <Dialog
              id={`${id}-dialog`}
              aria-label={`${label} picker`}
              className={styles['picker-popover__dialog']}
            >
              {children}
            </Dialog>
          </Popover>
        </DialogTrigger>
        {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
        {readOnly && (
          <span id={`${id}-readonly`} className="sr-only">
            Read only
          </span>
        )}
      </FormField>
    </I18nProvider>
  );
}
