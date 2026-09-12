import { cx } from '@/lib/cx';
import styles from './section.module.scss';

export function Section({ className, ...props }) {
  return <section className={cx(styles['section'], className)} {...props} />;
}
