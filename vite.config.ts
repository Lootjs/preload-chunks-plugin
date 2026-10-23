import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: { index: 'src/index.ts', client: 'src/client.ts' },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rolldownOptions: {
      external: ['vite'],
    },
    target: 'es2020',
    minify: false,
  },
});
