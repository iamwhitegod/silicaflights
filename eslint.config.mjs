import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import stylistic from '@stylistic/eslint-plugin';

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    name: 'silicaflights/spacing',
    files: ['**/*.{js,jsx,mjs,cjs}'],
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'directive', next: '*' },
        { blankLine: 'any', prev: 'directive', next: 'directive' },
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
        { blankLine: 'always', prev: '*', next: ['function', 'class', 'export'] },
        { blankLine: 'always', prev: ['function', 'class', 'export'], next: '*' },
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/components/atoms/**',
                '@/components/molecules/**',
                '@/components/organisms/**',
                '@/components/templates/**',
                '@/components/pages/**',
              ],
              message:
                'Import directly from the component’s current owner; legacy Atomic layer folders have been removed.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/**/*.{js,jsx}', 'src/lib/**/*.js', 'src/data/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app', '@/app/**', '**/app/**'],
              message: 'Shared code must not depend on route-owned code.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/ui/**/*.{js,jsx}', 'src/components/layout/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app', '@/app/**', '**/app/**'],
              message: 'Shared UI must not depend on routes.',
            },
            {
              group: [
                '@/components/flight-search/**',
                '@/components/signup/**',
                '@/components/site/**',
                '**/flight-search/**',
                '**/signup/**',
                '**/site/**',
                '@/data/**',
                '**/data/**',
              ],
              message: 'UI and layout primitives must remain independent of domain code and data.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/lib/**/*.js', 'src/data/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '**/app/**', '@/components/**', '**/components/**'],
              message: 'Shared utilities and data must not depend on UI or route code.',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    '.vercel/**',
    'coverage/**',
    'test-results/**',
    'playwright-report/**',
    'blob-report/**',
    'public/**',
    'assets/**',
    '**/*.min.js',
    'next-env.d.ts',
  ]),
  // Keep last: disable conflicts with Prettier; statement padding remains enabled.
  eslintConfigPrettier,
]);

export default eslintConfig;
