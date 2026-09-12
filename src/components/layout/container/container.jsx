import { cx } from '@/lib/cx';
import styles from './container.module.scss';

export function Container({ as: Tag = 'div', className, ...props }) {
  return <Tag className={cx(styles['container'], className)} {...props} />;
}
