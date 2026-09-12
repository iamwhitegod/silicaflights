import { cx } from '@/lib/cx';
import styles from './text.module.scss';

const sizeClasses = {
  body: styles['text--size-body'],
  compact: styles['text--size-compact'],
  caption: styles['text--size-caption'],
  label: styles['text--size-label'],
};

const toneClasses = {
  brand: styles['text--tone-brand'],
  inverse: styles['text--tone-inverse'],
  muted: styles['text--tone-muted'],
};

export function Text({ as: Tag = 'p', size = 'body', tone, className, children, ...props }) {
  return (
    <Tag className={cx(styles['text'], sizeClasses[size], toneClasses[tone], className)} {...props}>
      {children}
    </Tag>
  );
}
