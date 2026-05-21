import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        AbortController: 'readonly',
        BeforeUnloadEvent: 'readonly',
        BroadcastChannel: 'readonly',
        CustomEvent: 'readonly',
        crypto: 'readonly',
        DOMException: 'readonly',
        EventTarget: 'readonly',
        FileReader: 'readonly',
        HTMLInputElement: 'readonly',
        MessageEvent: 'readonly',
        MouseEvent: 'readonly',
        PerformanceObserver: 'readonly',
        TouchEvent: 'readonly',
        alert: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        confirm: 'readonly',
        console: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        window: 'readonly'
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
);
