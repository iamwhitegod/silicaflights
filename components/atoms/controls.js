import NextImage from 'next/image';
import { cx } from '@/lib/cx';
import s from './atoms.module.scss';

const icons = {
  settings: 'settings.svg',
  close: 'close.svg',
  check: 'check.svg',
  loading: 'loading.svg',
};
export function Icon({ name, size = 'md', className }) {
  return (
    <NextImage
      src={`/images/${icons[name]}`}
      alt=""
      width={24}
      height={24}
      unoptimized
      className={cx(s.icon, s[`icon-${size}`], className)}
    />
  );
}
export function Spinner() {
  return <Icon name="loading" className={s.spinner} />;
}
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
      className={cx(s.button, s[variant], s[`size-${size}`], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : success ? <Icon name="check" /> : null}
      {children}
    </button>
  );
}
export function IconButton({ label, icon, children, className, ...props }) {
  return (
    <Button variant="ghost" className={cx(s.iconButton, className)} aria-label={label} {...props}>
      {icon ? <Icon name={icon} /> : children}
    </Button>
  );
}
export function Input({ invalid, className, ...props }) {
  return (
    <input className={cx(s.input, className)} aria-invalid={invalid || undefined} {...props} />
  );
}
export function Link({ variant = 'inline', className, children, ...props }) {
  return (
    <a className={cx(s.link, s[`link-${variant}`], className)} {...props}>
      {children}
    </a>
  );
}
export function Image({ className, alt = '', ...props }) {
  return <NextImage alt={alt} className={cx(s.image, className)} {...props} />;
}
export function Status({ kind = 'info', children, className }) {
  return (
    <p className={cx(s.status, s[kind], className)} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
