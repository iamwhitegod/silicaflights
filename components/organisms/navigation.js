'use client';
import { Link } from '@/components/atoms/controls';
import s from './navigation.module.scss';
export default function Navigation() {
  return (
    <nav className={s.nav} aria-label="Main navigation">
      <Link href="/" variant="navigation" className={s.logo}>
        Silica Flights
      </Link>
      <Link
        href="#founder"
        className={s.join}
        variant="navigation"
        onClick={(event) => {
          const input = document.getElementById('founder-email');
          if (input) {
            event.preventDefault();
            document.getElementById('founder')?.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
            });
            input.focus({ preventScroll: true });
          }
        }}
      >
        Join Founders
      </Link>
    </nav>
  );
}
