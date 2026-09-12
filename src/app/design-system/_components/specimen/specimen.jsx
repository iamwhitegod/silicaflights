import { cx } from '@/lib/cx';
import styles from './specimen.module.scss';
export function Specimen({ title, children, wide }) {
  return (
    <div className={cx(styles['specimen'], wide && styles['specimen--wide'])}>
      <h3>{title}</h3>
      <div className={styles['specimen__sample']}>{children}</div>
    </div>
  );
}
