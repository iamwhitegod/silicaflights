import { cx } from '@/lib/cx';
import styles from './heading.module.scss';

const variantClasses = {
  hero: styles['heading--hero'],
  section: styles['heading--section'],
  card: styles['heading--card'],
  small: styles['heading--small'],
};

const toneClasses = {
  brand: styles['heading--tone-brand'],
  inverse: styles['heading--tone-inverse'],
  muted: styles['heading--tone-muted'],
};

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
    <Tag
      className={cx(styles['heading'], variantClasses[variant], toneClasses[tone], className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
