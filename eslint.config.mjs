import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
  ...nextVitals,
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
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
