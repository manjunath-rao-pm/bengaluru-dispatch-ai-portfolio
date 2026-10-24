// Keep one physical PBF payload across canonical source and ignored build output.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const name = 'planet_77.475,12.856_77.742,13.025.osm.pbf'
const source = path.join(root, 'public/source-data', name)
const target = path.join(root, 'dist/source-data', name)
const expected = '35f6a67ad1ab6f356edd55f61afcbdc07994f8363cf011872c1298d2a0e08cc0'
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
if (hash(source) !== expected || hash(target) !== expected) throw new Error('PBF integrity check failed; no replacement performed')
const a = fs.statSync(source), b = fs.statSync(target)
if (a.dev !== b.dev || a.ino !== b.ino) {
  // Only the exact verified generated file in this release dist directory is removed.
  fs.unlinkSync(target)
  try { fs.linkSync(source, target) } catch (error) {
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL)
    throw new Error('Hard link unavailable; restored verified build copy, but deduplication failed: ' + error.message)
  }
}
if (hash(target) !== expected) throw new Error('Linked PBF checksum mismatch')
console.log('PBF verified; canonical source and generated download share one physical payload (' + fs.statSync(source).size + ' bytes)')
