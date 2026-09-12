import { cx } from '@/lib/cx';
import styles from './label.module.scss';

export function Label({ className, ...props }) {
  return <label className={cx(styles['label'], className)} {...props} />;
}
