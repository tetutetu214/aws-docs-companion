import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.vite/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    prettier,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                chrome: 'readonly',
                LanguageModel: 'readonly',
            },
        },
        rules: {
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
        },
    },
    // 設定ファイル自体は型チェック対象外(tsconfig include に入れない方針)
    {
        files: ['eslint.config.js'],
        ...tseslint.configs.disableTypeChecked,
    },
);
