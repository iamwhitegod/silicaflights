'use client';

import { useSyncExternalStore } from 'react';
import styles from './color-palette.module.scss';

function getPaletteSnapshot() {
  const root = getComputedStyle(document.documentElement);

  return JSON.stringify(
    Array.from(root)
      .filter((name) => name.startsWith('--color-'))
      .sort()
      .map((name) => ({
        token: name.slice('--color-'.length),
        value: root.getPropertyValue(name).trim(),
      })),
  );
}

function getServerSnapshot() {
  return '[]';
}

function subscribe(onChange) {
  // Refresh when stylesheets load/change during development or root overrides change.
  const observer = new MutationObserver(onChange);
  observer.observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['href', 'media', 'disabled'],
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style'],
  });
  document.addEventListener('load', onChange, true);

  return () => {
    observer.disconnect();
    document.removeEventListener('load', onChange, true);
  };
}

function groupColors(colors) {
  const groups = new Map();

  for (const color of colors) {
    const family = color.token.match(/^(.+)-\d+$/)?.[1] ?? 'base';
    const swatches = groups.get(family) ?? [];
    swatches.push(color);
    groups.set(family, swatches);
  }

  return Array.from(groups, ([family, swatches]) => ({
    family,
    title: family === 'base' ? 'Black & white' : family[0].toUpperCase() + family.slice(1),
    colors: swatches.sort((a, b) => {
      if (a.token === b.token) return 0;
      if (a.token === 'white') return -1;
      if (b.token === 'white') return 1;

      return a.token.localeCompare(b.token, 'en', { numeric: true });
    }),
  })).sort((a, b) => {
    if (a.family === b.family) return 0;
    if (a.family === 'base') return -1;
    if (b.family === 'base') return 1;

    return a.family.localeCompare(b.family, 'en');
  });
}

export function ColorPalette() {
  const snapshot = useSyncExternalStore(subscribe, getPaletteSnapshot, getServerSnapshot);
  const palettes = groupColors(JSON.parse(snapshot));

  return (
    <div className={styles['color-palette']}>
      {palettes.map(({ family, title, colors }) => (
        <section key={family} aria-labelledby={`palette-${family}`}>
          <h3 id={`palette-${family}`} className={styles['color-palette__title']}>
            {title}
          </h3>
          <ul className={styles['color-palette__colors']}>
            {colors.map(({ token, value }) => (
              <li className={styles['color-palette__color']} data-color-token={token} key={token}>
                <div aria-hidden="true" style={{ background: `var(--color-${token})` }} />
                <strong>{token}</strong>
                <code>{value.toUpperCase()}</code>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
