import { Button } from '@/components/ui/button/button';
import { cx } from '@/lib/cx';
import styles from './chip.module.scss';

export function Chip({ children, selected, onClick, onRemove, disabled }) {
  return (
    <Button
      variant="neutral"
      size="sm"
      className={cx(styles['chip'], selected && styles['chip--selected'])}
      disabled={disabled}
      onClick={onRemove || onClick}
      aria-label={onRemove ? `Remove ${children}` : undefined}
      aria-pressed={onRemove ? undefined : !!selected}
    >
      {children}
      {onRemove && <span aria-hidden="true">×</span>}
    </Button>
  );
}
