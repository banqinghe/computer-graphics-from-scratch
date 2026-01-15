import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log(resolve(__dirname, 'rasterizer/index.html'));

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                rasterizer: resolve(__dirname, 'rasterizer/index.html'),
            },
        },
    },
});
