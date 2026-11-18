import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Statements that define a function: declarations, `const f = () => ...`, and their exported forms.
const fnInit = '/^(Arrow)?FunctionExpression$/';
const functionStatements = [
  'function',
  { selector: `VariableDeclaration[declarations.0.init.type=${fnInit}]` },
  { selector: 'ExportNamedDeclaration[declaration.type="FunctionDeclaration"]' },
  { selector: `ExportNamedDeclaration[declaration.declarations.0.init.type=${fnInit}]` },
  { selector: 'ExportDefaultDeclaration[declaration.type=/Function/]' },
];

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
    },
  },
  // Formatting (auto-fixable with `npm run lint:fix`).
  stylistic.configs.customize({ indent: 2, quotes: 'single', semi: true, braceStyle: '1tbs' }),
  {
    rules: {
      '@stylistic/max-statements-per-line': ['error', { max: 1 }],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
      '@stylistic/curly-newline': ['error', { minElements: 1 }],
      '@stylistic/no-floating-decimal': 'error',
      // One blank line before and after every function.
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: functionStatements, next: '*' },
        { blankLine: 'always', prev: '*', next: functionStatements },
      ],
      'curly': ['error', 'all'],
      'one-var': ['error', 'never'],
    },
  },
);
