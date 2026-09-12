import { cx } from '@/lib/cx';
import styles from './link.module.scss';

const variantClasses = {
  inline: styles['link--inline'],
  navigation: styles['link--navigation'],
  footer: styles['link--footer'],
};

export function Link({ variant = 'inline', className, children, ...props }) {
  return (
    <a className={cx(styles['link'], variantClasses[variant], className)} {...props}>
      {children}
    </a>
  );
}
