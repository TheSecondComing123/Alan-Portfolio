import js from '@eslint/js'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'

const modernEcmaGlobals = { ...(globals.es2024 || globals.es2023 || globals.es2022 || {}) }

export default [
    { ignores: ['node_modules/**', 'simulations/**', '.claude/**', 'coverage/**', 'dist/**'] },
    js.configs.recommended,
    {
        files: ['server.js', 'api/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: { ...globals.node, ...modernEcmaGlobals },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-useless-assignment': 'off',
            'eqeqeq': ['error', 'always'],
            'object-shorthand': ['error', 'always'],
            'prefer-template': 'error',
        },
    },
    {
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: {
                ...globals.browser,
                ...modernEcmaGlobals,
                gsap: 'readonly',
                ScrollTrigger: 'readonly',
                Lenis: 'readonly',
                lucide: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'eqeqeq': ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'error',
            'object-shorthand': ['error', 'always'],
            'prefer-template': 'error',
        },
    },
    eslintConfigPrettier,
]
