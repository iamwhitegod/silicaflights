import { Icon } from '@/components/ui/icon/icon';
import { Button } from '@/components/ui/button/button';
import { cx } from '@/lib/cx';
import styles from './icon-button.module.scss';

export function IconButton({ label, icon, children, className, ...props }) {
  return (
    <Button
      variant="ghost"
      className={cx(styles['icon-button'], className)}
      aria-label={label}
      {...props}
    >
      {icon ? <Icon name={icon} /> : children}
    </Button>
  );
}
