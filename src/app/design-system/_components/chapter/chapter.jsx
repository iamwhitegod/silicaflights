import { Heading } from '@/components/ui/heading/heading';
import styles from './chapter.module.scss';

export function Chapter({ id, number, title, children }) {
  return (
    <section id={id} className={styles['chapter']}>
      <div className={styles['chapter__title']}>
        <span>{number}</span>
        <Heading tone="default">{title}</Heading>
      </div>
      {children}
    </section>
  );
}
