import { getImageProps } from 'next/image';
import { cx } from '@/lib/cx';
import styles from './artwork.module.scss';

export function Artwork({ desktop, mobile = desktop, className }) {
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ src: desktop, alt: '', width: 2346, height: 1402, sizes: '100vw' });
  const { props: mobileProps } = getImageProps({
    src: mobile,
    alt: '',
    width: 690,
    height: 1008,
    sizes: '100vw',
  });
  return (
    <picture className={cx(styles['artwork'], className)}>
      <source media="(min-width: 48rem)" srcSet={desktopSrcSet} sizes="100vw" />
      <img {...mobileProps} alt="" />
    </picture>
  );
}
