import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

const CI = process.env.CI;

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [preact()],
    root: './src',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        assetsDir: 'static',
        minify: CI ? 'esbuild' : false,
        sourcemap: CI ? true : false,
        emptyOutDir: true,
        polyfillModulePreload: false,
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    }
});
