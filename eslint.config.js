import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

/** @type {import('eslint').Linter.Config} */
export default [
    stylistic.configs.customize({
        indent: 4,
        quotes: 'single',
        semi: true,
        jsx: false,
        braceStyle: '1tbs',
    }),
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
        },
    },
];
