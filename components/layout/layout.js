import { cx } from '@/lib/cx';
import s from './layout.module.scss';
export function Container({ as: Tag = 'div', className, ...props }) {
  return <Tag className={cx(s.container, className)} {...props} />;
}
export function Stack({ as: Tag = 'div', gap = '6', className, ...props }) {
  return (
    <Tag className={cx(s.stack, className)} style={{ '--gap': `var(--space-${gap})` }} {...props} />
  );
}
export function Grid({ className, ...props }) {
  return <div className={cx(s.grid, className)} {...props} />;
}
export function Section({ className, ...props }) {
  return <section className={cx(s.section, className)} {...props} />;
}
