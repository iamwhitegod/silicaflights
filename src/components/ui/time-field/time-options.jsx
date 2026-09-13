'use client';

import { useEffect, useRef, useState } from 'react';
import { ListBox, ListBoxItem } from 'react-aria-components';
import { Button } from '@/components/ui/button/button';
import styles from './time-options.module.scss';

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export function TimeOptions({ initialValue, onCommit }) {
  const [hour, setHour] = useState(initialValue.split(':')[0] || '00');
  const [minute, setMinute] = useState(initialValue.split(':')[1] || '00');
  const ref = useRef(null);
  useEffect(() => {
    // Scroll each independent list without moving the surrounding modal or page.
    for (const list of ref.current.querySelectorAll('[role="listbox"]')) {
      const selected = list.querySelector('[aria-selected="true"]');
      if (selected)
        list.scrollTop = selected.offsetTop - list.clientHeight / 2 + selected.clientHeight / 2;
    }
  }, []);

  return (
    <div ref={ref} className={styles['time-options']}>
      <div className={styles['time-options__summary']}>
        <span>24-hour time</span>
        <output aria-live="polite" aria-label="Selected time">
          {hour}:{minute}
        </output>
      </div>
      <div className={styles['time-options__columns']}>
        {[
          { label: 'Hours', options: hours, value: hour, set: setHour },
          { label: 'Minutes', options: minutes, value: minute, set: setMinute },
        ].map(({ label, options, value, set }) => (
          <div key={label} className={styles['time-options__column']}>
            <p className={styles['time-options__label']}>{label}</p>
            <ListBox
              aria-label={label}
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[value]}
              onSelectionChange={(keys) => set([...keys][0])}
              className={styles['time-options__list']}
              data-lenis-prevent
            >
              {options.map((option) => (
                <ListBoxItem
                  id={option}
                  key={option}
                  textValue={option}
                  className={styles['time-options__option']}
                >
                  {option}
                </ListBoxItem>
              ))}
            </ListBox>
          </div>
        ))}
      </div>
      <div className={styles['time-options__actions']}>
        <Button variant="ghost" size="sm" onClick={() => onCommit('')}>
          Clear
        </Button>
        <Button size="sm" onClick={() => onCommit(`${hour}:${minute}`)}>
          Done
        </Button>
      </div>
    </div>
  );
}
