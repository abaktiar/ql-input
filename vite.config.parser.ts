import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: [
        'src/lib/ql-types.ts',
        'src/lib/ql-parser.ts',
        'src/lib/ql-expression-parser.ts',
        'src/lib/ql-query-builder.ts',
        'src/lib/index.parser.ts'
      ],
      exclude: [
        'src/components/**/*',
        'src/hooks/**/*',
        'src/App.tsx',
        'src/main.tsx',
        'tests/**/*',
        'playwright.config.ts',
        'vite.config.ts',
        'vite.config.*.ts'
      ],
      outDir: 'dist/parser',
      insertTypesEntry: true,
      rollupTypes: true,
      tsconfigPath: './tsconfig.app.json'
    })
  ],
  build: {
    outDir: 'dist/parser',
    lib: {
      entry: resolve(__dirname, 'src/lib/index.parser.ts'),
      name: 'QLParser',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    },
    sourcemap: true,
    minify: 'terser'
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  }
})
