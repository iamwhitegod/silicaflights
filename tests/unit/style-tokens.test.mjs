import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { compileString } from 'sass';

const stylesDirectory = fileURLToPath(new URL('../../src/styles/', import.meta.url));

function compile(source) {
  return compileString(source, { loadPaths: [stylesDirectory], style: 'compressed' }).css;
}

test('style accessors return typed Sass colors and lengths without emitting CSS', () => {
  assert.equal(
    compile(`
      @use 'sass:color';
      @use 'sass:math';
      @use 'index' as ds;

      @if ds.color('blue-700') != #0045d7 { @error 'Action color changed'; }
      @if color.channel(ds.color('navy-950', 0.5), 'alpha') != 0.5 { @error 'Alpha changed'; }
      @if math.div(ds.font-size('body'), 1rem) != 1.6 { @error 'Body size changed'; }
    `),
    '',
  );
});

test('fluid typography and colors compile correctly in declarations and custom properties', () => {
  const css = compile(`
    @use 'index' as ds;
    .sample {
      color: ds.color('white');
      background: ds.color('navy-950', 0.5);
      font-size: ds.font-size('offer-time');
      font: 600 #{ds.font-size('card')}/1.25 sans-serif;
      --button-background: #{ds.color('amber-300')};
    }
  `);
  assert.match(css, /color:(?:#fff|white);/);
  assert.match(css, /background:rgba\(8,27,56,0?\.5\);/);
  assert.match(css, /font-size:clamp\(2rem,4vw,3\.2rem\);/);
  assert.match(css, /font:600 2\.4rem\/1\.25 sans-serif;/);
  assert.match(css, /--button-background:\s*#fccb5f/);
});

test('opacity overrides preserve RGB channels and accept transparent and opaque boundaries', () => {
  assert.equal(
    compile(`
      @use 'sass:color';
      @use 'index' as ds;
      @each $alpha in 0, 0.18, 0.5, 1 {
        $value: ds.color('blue-700', $alpha);
        @if color.channel($value, 'alpha') != $alpha { @error 'Opacity changed'; }
        @if color.channel($value, 'red', $space: rgb) != 0 { @error 'Red changed'; }
        @if color.channel($value, 'green', $space: rgb) != 69 { @error 'Green changed'; }
        @if color.channel($value, 'blue', $space: rgb) != 215 { @error 'Blue changed'; }
      }
      @if color.channel(ds.color('blue-700'), 'alpha') != 1 { @error 'Base must be opaque'; }
    `),
    '',
  );
});

test('opacity rejects out-of-range values, units, non-numbers, and non-finite numbers', () => {
  for (const alpha of [
    '-0.01',
    '1.01',
    '50%',
    '1px',
    'true',
    "'0.5'",
    'var(--opacity)',
    'calc(NaN)',
    'calc(infinity)',
  ]) {
    assert.throws(
      () => compile(`@use 'index' as ds; .sample { color: ds.color('blue-700', ${alpha}); }`),
      /Invalid color opacity.*Expected a unitless number from 0 to 1/,
    );
  }
});

test('palette contains unique opaque colors with numbered shades ordered from light to dark', () => {
  const css = compile(`
    @use 'sass:color';
    @use 'index' as ds;
    .palette {
      @each $name, $value in ds.$colors {
        @if color.channel($value, 'alpha') != 1 { @error 'Palette colors must be opaque'; }
        --#{$name}: #{$value};
      }
    }
  `);
  const colors = [...css.matchAll(/--([\w-]+):\s*(#[\da-f]{3,6});?/g)];
  const seen = new Set();
  const families = new Map();
  assert.ok(colors.length > 0);

  for (const [, name, hex] of colors) {
    const expanded =
      hex.length === 4 ? '#' + [...hex.slice(1)].map((part) => part + part).join('') : hex;
    assert.ok(!seen.has(expanded), `Duplicate RGB value: ${name}`);
    seen.add(expanded);
    if (name === 'white' || name === 'black') continue;

    const match = name.match(/^([a-z]+)-(\d+)$/);
    assert.ok(match, `Invalid palette name: ${name}`);
    const [, family, step] = match;
    const shade = Number(step);
    assert.ok(shade >= 50 && shade <= 950 && shade % 50 === 0, `Invalid shade: ${name}`);
    const channels = expanded
      .slice(1)
      .match(/../g)
      .map((part) => parseInt(part, 16) / 255);
    const linear = channels.map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
    const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    const shades = families.get(family) ?? [];
    shades.push({ shade, luminance });
    families.set(family, shades);
  }

  for (const [family, shades] of families) {
    shades.sort((a, b) => a.shade - b.shade);
    for (let index = 1; index < shades.length; index++) {
      assert.ok(
        shades[index - 1].luminance > shades[index].luminance,
        `${family} must get darker as shade numbers increase`,
      );
    }
  }
});

test('retired aliases and unpopulated shades fail instead of falling back to another color', () => {
  for (const name of ['action', 'flight-text', 'blue-600']) {
    assert.throws(
      () => compile(`@use 'index' as ds; .sample { color: ds.color('${name}'); }`),
      /Unknown color token/,
    );
  }
});

for (const accessor of ['color', 'font-size']) {
  test(`${accessor} rejects unknown tokens with an actionable compilation error`, () => {
    assert.throws(
      () => compile(`@use 'index' as ds; .sample { value: ds.${accessor}('missing-token'); }`),
      new RegExp(`Unknown ${accessor} token "missing-token".*Available tokens:`),
    );
  });
}

test('generated CSS properties retain the palette and responsive typography contract', () => {
  const css = compile(`
    @use 'index' as ds;
    :root { @include ds.properties; }
    @include ds.from(desktop) {
      :root {
        --text-hero: #{ds.font-size('hero-desktop')};
        --text-section: #{ds.font-size('section-desktop')};
      }
    }
  `);
  assert.match(css, /--color-blue-700:\s*#0045d7/);
  assert.doesNotMatch(css, /--color-(?:action|flight-text|overlay):/);
  assert.match(css, /--text-hero:\s*3\.2rem/);
  assert.match(css, /--text-section:\s*3\.2rem/);
  assert.match(css, /@media\(min-width:\s*64rem\)/);
  assert.match(css, /--text-hero:\s*5\.6rem/);
  assert.match(css, /--text-section:\s*4\.8rem/);
  assert.doesNotMatch(css, /(?:ds|fn)\.(?:color|font-size)\(/);
});
