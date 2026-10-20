import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      outDirs: 'dist',
      processor: 'vue',
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'SbFloatingPanelVue',
      fileName: (format) => `sb-floating-panel.${format}.js`,
    },
    rolldownOptions: {
      external: ['vue', '@floating-ui/vue'],
      output: {
        globals: {
          vue: 'Vue',
          '@floating-ui/vue': 'FloatingUIVue',
        },
      },
    },
  },
});
