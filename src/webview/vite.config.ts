import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const appToBuild = process.env.APP_NAME;
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: `src/${appToBuild}/index.tsx`,
      output: {
        // Specify naming conventions here without a hash
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
    outDir: appToBuild
      ? `../webview-dist/${appToBuild}`
      : '../webview-dist/',
  },
});
