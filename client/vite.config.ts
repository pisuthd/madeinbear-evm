import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  optimizeDeps: {
    // Force inclusion of problematic packages to pre-bundle them correctly
    include: ['iframe-shared-storage'],
    // Exclude CoFHE SDK from optimization as it has WASM
    exclude: ['@cofhe/sdk/web']
  },
  resolve: {
    alias: {
      // Ensure iframe-shared-storage uses the correct entry point
      'iframe-shared-storage': 'iframe-shared-storage/dist/index.js'
    }
  },
  build: {
    // Ensure WASM files are properly handled
    assetsInlineLimit: 0,
    // Don't bundle WASM
    rollupOptions: {
      output: {
        // Ensure WASM files are not bundled
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'tfhe.wasm') {
            return 'assets/wasm/[name].[hash][extname]'
          }
          return 'assets/[name].[hash][extname]'
        }
      }
    }
  }
})
