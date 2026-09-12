import { cx } from '@/lib/cx';
import styles from './status.module.scss';

const kindClasses = {
  info: styles['status--info'],
  error: styles['status--error'],
  success: styles['status--success'],
};

export function Status({ kind = 'info', children, className }) {
  return (
    <p
      className={cx(styles['status'], kindClasses[kind], className)}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}
