import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Modules split from the original prototype that are not typed yet (they start with `// @ts-nocheck`).
// Only formatting rules apply to them. Remove a file from this list once it is typed.
const untyped = [
  'src/audio.ts',
  'src/bots.ts',
  'src/br/pickups.ts',
  'src/br/zone.ts',
  'src/combat.ts',
  'src/effects.ts',
  'src/grenades.ts',
  'src/hud/hud.ts',
  'src/hud/minimap.ts',
  'src/input.ts',
  'src/loadout.ts',
  'src/loop.ts',
  'src/menu.ts',
  'src/modes.ts',
  'src/physics.ts',
  'src/player.ts',
  'src/render/renderer.ts',
  'src/shop.ts',
  'src/sim.ts',
  'src/viewmodel.ts',
  'src/weapons.ts',
  'src/world/doors.ts',
  'src/world/level.ts',
  'src/world/maps.ts',
  'src/world/terrain.ts',
  'src/world/worldgen.ts',
];

// Statements that define a function: declarations, `const f = () => ...`, and their exported forms.
const fnInit = '/^(Arrow)?FunctionExpression$/';
const functionStatements = [
  'function',
  { selector: `VariableDeclaration[declarations.0.init.type=${fnInit}]` },
  { selector: 'ExportNamedDeclaration[declaration.type="FunctionDeclaration"]' },
  { selector: `ExportNamedDeclaration[declaration.declarations.0.init.type=${fnInit}]` },
  { selector: 'ExportDefaultDeclaration[declaration.type=/Function/]' },
];

const correctnessRules = [js.configs.recommended, ...tseslint.configs.recommended].flatMap(c => Object.keys(c.rules ?? {}));

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
  {
    files: untyped,
    rules: {
      ...Object.fromEntries(correctnessRules.map(r => [r, 'off'])),
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
);
