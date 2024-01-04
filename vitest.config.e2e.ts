import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['k6/**/*', 'node_modules/**/*'],
    globals: true,
    root: './',
    alias: {
      src: './src',
      test: './test',
    },
  },
  resolve: {
    alias: {
      src: './src',
      test: './test',
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
