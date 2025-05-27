import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    dts({
      include: [
        'src/lib/ql-types.ts',
        'src/lib/ql-parser.ts',
        'src/lib/ql-expression-parser.ts',
        'src/lib/ql-query-builder.ts',
        'src/lib/index.parser.ts',
      ],
      exclude: [
        'src/components/**/*',
        'src/hooks/**/*',
        'src/App.tsx',
        'src/main.tsx',
        'tests/**/*',
        'playwright.config.ts',
        'vite.config.ts',
        'vite.config.*.ts',
      ],
      outDir: 'dist/parser',
      insertTypesEntry: true,
      rollupTypes: true,
      tsconfigPath: './tsconfig.app.json',
      afterBuild: () => {
        // Rename .d.mts to .d.ts after build
        const distDir = path.resolve(process.cwd(), 'dist/parser');
        const mtsFile = path.join(distDir, 'index.d.mts');
        const dtsFile = path.join(distDir, 'index.d.ts');

        if (fs.existsSync(mtsFile)) {
          fs.renameSync(mtsFile, dtsFile);
          console.log('Renamed index.d.mts to index.d.ts');
        }
      },
    }),
  ],
  build: {
    outDir: 'dist/parser',
    lib: {
      entry: resolve(__dirname, 'src/lib/index.parser.ts'),
      name: 'QLParser',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    sourcemap: true,
    minify: 'terser',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
