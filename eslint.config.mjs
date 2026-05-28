import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
      // Pages-Router-era rule: warns about beforeInteractive scripts outside
      // pages/_document.js. This project is App Router only, where root
      // layout (app/layout.tsx) is the documented placement for
      // beforeInteractive scripts. Off.
      '@next/next/no-before-interactive-script-outside-document': 'off',
    },
  },
  {
    ignores: [
      '.next/',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
      'infra/cdk.out/',
      'infra/node_modules/',
    ],
  },
  {
    // CDK infrastructure code — plain Node TypeScript, not React/Next.
    // The Next preset's JSX/TSX-targeted rules are filename-filtered so
    // they don't fire here; this block exists to make inclusion explicit
    // and to override anything Next-specific that surfaces incorrectly.
    files: ['infra/**/*.ts'],
    rules: {
      // CDK constructs commonly use `new Construct(this, 'Id')` where the
      // construct is intentionally unreferenced after instantiation
      // (side-effect registration with the parent scope).
      '@typescript-eslint/no-unused-expressions': 'off',
      // CDK aspects often have `any` in their visitor signatures
      // (cdk-lib's own IAspect.visit returns `void` against `IConstruct`).
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]

export default eslintConfig
