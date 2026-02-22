import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@engine/core': resolve(__dirname, 'engines/orillusion-src/core/index.ts'),
      '@engine/geometry': resolve(__dirname, 'engines/orillusion-src/geometry/index.ts'),
      '@engine/particle': resolve(__dirname, 'engines/orillusion-src/particle/index.ts'),
      '@engine/physics': resolve(__dirname, 'engines/orillusion-src/physics/index.ts'),
      '@engine/stats': resolve(__dirname, 'engines/orillusion-src/stats/index.ts'),
      '@engine/ammo': resolve(__dirname, 'engines/orillusion-src/ammo/index.ts'),
      '@engine/graphic': resolve(__dirname, 'engines/orillusion-src/graphic/index.ts'),
      '@engine/wasm-matrix': resolve(__dirname, 'engines/orillusion-src/packages/wasm-matrix'),
    },
  },
  // Keep Kenney GLB + Textures directory structure so relative texture URIs in GLB resolve correctly.
  publicDir: resolve(__dirname, '../assetdirectory/pack/kenney/building-kit/Models/GLB format'),
  server: {
    host: '0.0.0.0',
    port: 5174,
    fs: {
      allow: [resolve(__dirname, '..')],
    },
  },
})
