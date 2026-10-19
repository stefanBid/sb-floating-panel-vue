import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      reporter: ['text', 'json-summary', 'lcov'],
    },
  },
});
