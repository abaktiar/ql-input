import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/components/**/*', 'src/hooks/**/*', 'src/lib/**/*', 'src/index.input.ts'],
      exclude: [
        'src/components/ql-demo.tsx',
        'src/App.tsx',
        'src/main.tsx',
        'tests/**/*',
        'playwright.config.ts',
        'vite.config.ts',
        'vite.config.*.ts',
      ],
      outDir: 'dist/input',
      insertTypesEntry: true,
      rollupTypes: true,
      tsconfigPath: './tsconfig.app.json',
      afterBuild: () => {
        // Rename .d.mts to .d.ts after build
        const distDir = path.resolve(process.cwd(), 'dist/input');
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
    outDir: 'dist/input',
    lib: {
      entry: resolve(__dirname, 'src/index.input.ts'),
      name: 'QLInput',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@abaktiar/ql-parser'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@abaktiar/ql-parser': 'QLParser',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'styles.css';
          return assetInfo.name || 'asset';
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
