import { Icon } from '@/components/ui/icon/icon';
import { Spinner } from '@/components/ui/spinner/spinner';
import { cx } from '@/lib/cx';
import styles from './button.module.scss';

const variantClasses = {
  primary: styles['button--primary'],
  secondary: styles['button--secondary'],
  neutral: styles['button--neutral'],
  ghost: styles['button--ghost'],
};

const sizeClasses = {
  sm: styles['button--size-sm'],
  md: styles['button--size-md'],
  lg: styles['button--size-lg'],
};

/**
 * @param {import('react').ComponentPropsWithoutRef<'button'> & {
 *   variant?: 'primary' | 'secondary' | 'neutral' | 'ghost',
 *   size?: 'sm' | 'md' | 'lg', loading?: boolean, success?: boolean
 * }} props
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  success = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cx(styles['button'], variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : success ? <Icon name="check" /> : null}
      {children}
    </button>
  );
}
