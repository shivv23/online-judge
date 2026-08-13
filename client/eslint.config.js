import tseslint from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

const tsFlat = tseslint.configs['flat/recommended'].map((config) => ({
  ...config,
  files: ['**/*.{ts,tsx}'],
}));

export default [
  { ignores: ['dist'] },
  ...tsFlat,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
    },
  },
];
