import NextImage from 'next/image';
import { cx } from '@/lib/cx';
import styles from './icon.module.scss';

const sizeClasses = {
  sm: styles['icon--size-sm'],
  lg: styles['icon--size-lg'],
};

const icons = {
  close: 'close.svg',
  check: 'check.svg',
  loading: 'loading.svg',
};
const lineIcons = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M7 3v4M17 3v4M3 11h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  'chevron-left': <path d="m14 7-5 5 5 5" />,
  'chevron-right': <path d="m10 7 5 5-5 5" />,
};
export function Icon({ name, size = 'md', className }) {
  const iconClassName = cx(styles['icon'], sizeClasses[size], className);

  if (lineIcons[name]) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className={iconClassName}
      >
        {lineIcons[name]}
      </svg>
    );
  }

  // Preserve the Figma asset geometry, allowing the stroke to follow the control color.
  if (name === 'settings') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className={iconClassName}
      >
        <path d="M18.3333 5.41667H13.3333M5 5.41667H1.66667M18.3333 14.5833H15M6.66667 14.5833H1.66667" />
        <path d="M8.33333 8.33333C9.94416 8.33333 11.25 7.0275 11.25 5.41667C11.25 3.80584 9.94416 2.5 8.33333 2.5C6.7225 2.5 5.41667 3.80584 5.41667 5.41667C5.41667 7.0275 6.7225 8.33333 8.33333 8.33333Z" />
        <path d="M11.6667 17.5C13.2775 17.5 14.5833 16.1942 14.5833 14.5833C14.5833 12.9725 13.2775 11.6667 11.6667 11.6667C10.0558 11.6667 8.75 12.9725 8.75 14.5833C8.75 16.1942 10.0558 17.5 11.6667 17.5Z" />
      </svg>
    );
  }

  return (
    <NextImage
      src={`/images/${icons[name]}`}
      alt=""
      width={24}
      height={24}
      unoptimized
      className={iconClassName}
    />
  );
}
