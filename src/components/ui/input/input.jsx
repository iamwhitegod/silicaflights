import { cx } from '@/lib/cx';
import styles from './input.module.scss';

export function Input({ invalid, className, ...props }) {
  return (
    <input
      className={cx(styles['input'], className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
