'use client';
import { Link } from '@/components/ui/link/link';
import { usePageScroll } from '@/components/ui/scroll-provider/scroll-provider';
import styles from './navigation.module.scss';

export function Navigation() {
  const { scrollTo } = usePageScroll();
  return (
    <nav className={styles['navigation']} aria-label="Main navigation" data-hero-reveal>
      <Link href="/" variant="navigation" className={styles['navigation__logo']}>
        Silica Flights
      </Link>
      <Link
        href="#founder"
        className={styles['navigation__join']}
        variant="navigation"
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const input = document.getElementById('founder-email');
          if (input) {
            event.preventDefault();
            history.pushState(null, '', '#founder');
            scrollTo('#founder', { focus: input });
          }
        }}
      >
        Join Founders
      </Link>
    </nav>
  );
}
