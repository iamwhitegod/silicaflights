'use client';
import {
  Calendar as AriaCalendar,
  CalendarGrid,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
  CalendarCell,
  Button as AriaButton,
  Heading,
} from 'react-aria-components';
import { today, getLocalTimeZone } from '@internationalized/date';
import { Button } from '@/components/ui/button/button';
import { Icon } from '@/components/ui/icon/icon';
import { parseDateValue } from './date-values';
import styles from './calendar.module.scss';

/** Single-month calendar. All public date values are YYYY-MM-DD strings. */
export function Calendar({ label, value, onValueChange, min, max }) {
  const selected = parseDateValue(value);
  const minimum = parseDateValue(min);
  const maximum = parseDateValue(max);
  const currentDay = today(getLocalTimeZone());
  const canChooseToday =
    (!minimum || currentDay.compare(minimum) >= 0) &&
    (!maximum || currentDay.compare(maximum) <= 0);
  let initialFocus = selected || currentDay;
  if (minimum && initialFocus.compare(minimum) < 0) initialFocus = minimum;
  if (maximum && initialFocus.compare(maximum) > 0) initialFocus = maximum;

  return (
    <div className={styles['calendar']}>
      <AriaCalendar
        aria-label={label}
        value={selected}
        onChange={(date) => onValueChange(date.toString())}
        minValue={minimum || undefined}
        maxValue={maximum || undefined}
        defaultFocusedValue={initialFocus}
        firstDayOfWeek="mon"
        autoFocus
        className={styles['calendar__month']}
      >
        <header className={styles['calendar__header']}>
          <Heading className={styles['calendar__heading']} />
          <div className={styles['calendar__navigation']}>
            <AriaButton slot="previous" className={styles['calendar__month-button']}>
              <Icon name="chevron-left" />
            </AriaButton>
            <AriaButton slot="next" className={styles['calendar__month-button']}>
              <Icon name="chevron-right" />
            </AriaButton>
          </div>
        </header>
        <CalendarGrid className={styles['calendar__grid']} weekdayStyle="short">
          <CalendarGridHeader>
            {(day) => (
              <CalendarHeaderCell className={styles['calendar__weekday']}>{day}</CalendarHeaderCell>
            )}
          </CalendarGridHeader>
          <CalendarGridBody>
            {(date) => <CalendarCell date={date} className={styles['calendar__day']} />}
          </CalendarGridBody>
        </CalendarGrid>
      </AriaCalendar>
      <div className={styles['calendar__actions']}>
        <Button variant="ghost" size="sm" onClick={() => onValueChange('')}>
          Clear
        </Button>
        <Button
          variant="neutral"
          size="sm"
          disabled={!canChooseToday}
          onClick={() => onValueChange(currentDay.toString())}
        >
          Today
        </Button>
      </div>
    </div>
  );
}
