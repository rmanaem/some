/* eslint-disable import/no-extraneous-dependencies */
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import tsdocPlugin from 'eslint-plugin-tsdoc';
import prettierConfig from 'eslint-config-prettier';
import google from 'eslint-config-google';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

/* ---------- ignores ---------- */
const ignores = globalIgnores([
  'dist',
  '**/node_modules/**',
  'eslint.config.mjs',
  'lint-staged.config.js',
]);

/* ---------- base language options ---------- */
const baseLanguageOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module',
  parser: tsParser,
  parserOptions: { project: ['./tsconfig.*json'] },
  globals: {
    ...globals.browser,
    ...globals.es2020,
    ...globals.node,
  },
};

/* ---------- config array ---------- */
export default defineConfig([
  ignores,

  /* JS recommended + prettier off-rules */
  {
    ...js.configs.recommended,
    ...prettierConfig,
  },

  /* TypeScript rules */
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: baseLanguageOptions,
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@stylistic/indent': 'off',
      '@stylistic/comma-dangle': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  /* Google + Google-TypeScript */
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { import: importPlugin },
    rules: {
      ...google.rules,
      'valid-jsdoc': 'off',
      'require-jsdoc': 'off',
      ...tsPlugin.configs.recommended.rules,
      'import/prefer-default-export': 'off',
      'no-param-reassign': [
        'error',
        { props: true, ignorePropertyModificationsFor: ['draft'] },
      ],
    },
    settings: {
      'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
      },
    },
  },

  /* React */
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { react: reactPlugin },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
    settings: { react: { version: 'detect' } },
  },

  /* React-hooks */
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'react-hooks': reactHooksPlugin },
    rules: reactHooksPlugin.configs.recommended.rules,
  },

  /* jsx-a11y */
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'jsx-a11y': jsxA11yPlugin },
    rules: jsxA11yPlugin.configs.recommended.rules,
  },

  /* TSDoc */
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { tsdoc: tsdocPlugin },
    rules: { 'tsdoc/syntax': 'warn' },
  },
]);