import { promises as fs } from 'node:fs'
import path from 'node:path'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

const files = process.argv.slice(2)
const loader = new FBXLoader()

for (const file of files) {
  const abs = path.resolve(file)
  const buf = await fs.readFile(abs)
  const arr = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const group = loader.parse(arr, path.dirname(abs) + '/')
  const clips = group.animations ?? []
  console.log(`FILE ${file}`)
  if (clips.length === 0) {
    console.log('  (no clips)')
    continue
  }
  for (const clip of clips) {
    console.log(`  clip=${clip.name} duration=${clip.duration.toFixed(3)} tracks=${clip.tracks.length}`)
  }
}
