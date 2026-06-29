import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default defineConfig([
  // Global Rules / Basic Configuration
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // BACKEND Specific Configuration & General TS Code
  {
    files: ['**/*.ts'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // FRONTEND Custom Configuration (React + Vite + TSX)
  {
    files: ['client/src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Files and Folders ignored by ESLint
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*test.ts', 'apps/client-web/vite.config.ts'],
  },
]);
