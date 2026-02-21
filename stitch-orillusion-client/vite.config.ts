import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
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
