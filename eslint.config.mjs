import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/next-env.d.ts', 'postman/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly', URLSearchParams: 'readonly', URL: 'readonly', fetch: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly', window: 'readonly', document: 'readonly', localStorage: 'readonly', sessionStorage: 'readonly', navigator: 'readonly', alert: 'readonly', confirm: 'readonly', location: 'readonly', React: 'readonly', StorageEvent: 'readonly', Event: 'readonly', CustomEvent: 'readonly', HTMLElement: 'readonly', HTMLInputElement: 'readonly', FileReader: 'readonly', FormData: 'readonly', AbortController: 'readonly', describe: 'readonly', it: 'readonly', test: 'readonly', expect: 'readonly', jest: 'readonly', beforeEach: 'readonly', afterEach: 'readonly', beforeAll: 'readonly', afterAll: 'readonly', require: 'readonly', module: 'readonly', __dirname: 'readonly' } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-undef': 'off',
      'no-constant-condition': ['error', { checkLoops: false }],
    },
  },
];
