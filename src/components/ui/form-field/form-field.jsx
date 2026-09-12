import { Label } from '@/components/ui/label/label';
import { cx } from '@/lib/cx';
import styles from './form-field.module.scss';

/**
 * Associates a control with its label, hint, and validation feedback.
 * The optional action shares the control row on wider viewports.
 * @param {{id: string, label: import('react').ReactNode,
 *   children: import('react').ReactNode, action?: import('react').ReactNode,
 *   hint?: string, error?: string, required?: boolean, className?: string}} props
 */
export function FormField({ label, hint, error, id, children, required, className, action }) {
  return (
    <div
      className={cx(styles['form-field'], action && styles['form-field--with-action'], className)}
    >
      <Label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </Label>
      {action ? <div className={styles['form-field__control']}>{children}</div> : children}
      {hint && (
        <p id={`${id}-hint`} className={styles['form-field__hint']}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles['form-field__error']} role="alert">
          {error}
        </p>
      )}
      {action && <div className={styles['form-field__action']}>{action}</div>}
    </div>
  );
}
