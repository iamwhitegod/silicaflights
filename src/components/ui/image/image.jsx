import NextImage from 'next/image';
import { cx } from '@/lib/cx';
import styles from './image.module.scss';

export function Image({ className, alt = '', ...props }) {
  return <NextImage alt={alt} className={cx(styles['image'], className)} {...props} />;
}
