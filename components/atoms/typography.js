import { cx } from '@/lib/cx';
import s from './atoms.module.scss';

export function Heading({
  level = 2,
  variant = 'section',
  tone = 'brand',
  className,
  children,
  ...props
}) {
  const Tag = `h${level}`;
  return (
    <Tag className={cx(s.heading, s[variant], s[tone], className)} {...props}>
      {children}
    </Tag>
  );
}
export function Text({ as: Tag = 'p', size = 'body', tone, className, children, ...props }) {
  return (
    <Tag className={cx(s.text, s[size], s[tone], className)} {...props}>
      {children}
    </Tag>
  );
}
export function Label({ className, ...props }) {
  return <label className={cx(s.label, className)} {...props} />;
}
