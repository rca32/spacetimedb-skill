import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@orillusion/core': resolve(__dirname, 'src/vendor/orillusion/core'),
      '@orillusion/geometry': resolve(__dirname, 'src/vendor/orillusion/geometry'),
      '@orillusion/particle': resolve(__dirname, 'src/vendor/orillusion/particle'),
      '@orillusion/physics': resolve(__dirname, 'src/vendor/orillusion/physics'),
      '@orillusion/stats': resolve(__dirname, 'src/vendor/orillusion/stats'),
      '@orillusion/ammo': resolve(__dirname, 'src/vendor/orillusion/ammo'),
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
