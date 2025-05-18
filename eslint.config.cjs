const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const vuePlugin = require('eslint-plugin-vue')
const vueParser = require('vue-eslint-parser')
const prettierPlugin = require('eslint-plugin-prettier')

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  // Ignore generated and dependency folders
  {
    ignores: ['node_modules/**', 'dist/**', 'types/**']
  },

  // TypeScript support
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prettier/prettier': 'warn'
    }
  },

  // Vue single-file components
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2021,
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      }
    },
    plugins: {
      vue: vuePlugin,
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin
    },
    rules: {
      // Vue rules known to work with Flat Config
      'vue/no-multiple-template-root': 'off',
      'vue/require-prop-types': 'warn',
      'vue/require-default-prop': 'warn',
      'vue/attribute-hyphenation': ['warn', 'always'],
      'vue/html-self-closing': ['warn', {
        html: { normal: 'never', void: 'always' },
        svg: 'always',
        math: 'always',
      }],
      'vue/multi-word-component-names': 'off',
      'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
      'vue/no-unused-components': 'warn',
      'vue/no-template-shadow': 'warn',
      'vue/no-mutating-props': 'warn',
      'vue/prop-name-casing': ['warn', 'camelCase'],
      'vue/no-v-text-v-html-on-component': 'warn',
      'vue/attributes-order': ['warn', {
        order: [
          'DEFINITION', 'LIST_RENDERING', 'CONDITIONALS', 'RENDER_MODIFIERS',
          'GLOBAL', 'UNIQUE', 'TWO_WAY_BINDING', 'OTHER_DIRECTIVES',
          'OTHER_ATTR', 'CONTENT', 'EVENTS'
        ],
        alphabetical: false,
      }],
      'prettier/prettier': 'warn'
    }
  }
]
