import { cx } from '@/lib/cx';
import styles from './grid.module.scss';

export function Grid({ className, ...props }) {
  return <div className={cx(styles['grid'], className)} {...props} />;
}
