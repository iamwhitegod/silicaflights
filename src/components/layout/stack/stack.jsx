import { cx } from '@/lib/cx';
import styles from './stack.module.scss';

export function Stack({ as: Tag = 'div', gap = '6', className, ...props }) {
  return (
    <Tag
      className={cx(styles['stack'], className)}
      style={{ '--gap': `var(--space-${gap})` }}
      {...props}
    />
  );
}
