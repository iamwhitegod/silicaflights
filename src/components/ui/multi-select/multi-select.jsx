'use client';
import { Combobox } from '@/components/ui/combobox/combobox';
import { Chip } from '@/components/ui/chip/chip';
import styles from './multi-select.module.scss';

export function MultiSelect({ label, options, value, onValueChange }) {
  return (
    <div className={styles['multi-select']}>
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
        <div
          className={styles['multi-select__chips']}
          role="group"
          aria-label={`${label} selections`}
        >
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
