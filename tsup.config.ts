import builtins from 'builtin-modules';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  bundle: true,
  format: 'cjs',
  outDir: '.',
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...builtins,
  ],
});
