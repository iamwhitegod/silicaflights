import { Icon } from '@/components/ui/icon/icon';
import styles from './spinner.module.scss';

export function Spinner() {
  return <Icon name="loading" className={styles['spinner']} />;
}
