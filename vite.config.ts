import { defineConfig } from 'vitest/config';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json' with { type: 'json' };

export default defineConfig({
    plugins: [crx({ manifest })],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'esnext',
    },
    test: {
        environment: 'jsdom',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/types/**', 'src/**/*.d.ts'],
        },
    },
});
