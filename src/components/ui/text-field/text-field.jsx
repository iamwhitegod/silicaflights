'use client';

import { useId } from 'react';
import { Input } from '@/components/ui/input/input';
import { FormField } from '@/components/ui/form-field/form-field';

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
