import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'

test('recipient source download contains all distributed route data without alteration', () => {
  const root = new URL('../', import.meta.url)
  const bundle = JSON.parse(fs.readFileSync(new URL('public/route-data-source.json', root), 'utf8'))
  assert.equal(bundle.license, 'ODbL-1.0')
  assert.equal(bundle.licenseUrl, 'https://opendatacommons.org/licenses/odbl/1-0/')
  const paths = ['src/data/bengaluru-delivery-roads.json', 'docs/local-routing/local-pickup-evidence.json', 'docs/local-routing/local-delivery-evidence.json']
  assert.deepEqual(bundle.datasets.map(item => item.path), paths)
  for (const item of bundle.datasets) {
    const original = fs.readFileSync(new URL(item.path, root))
    assert.equal(item.sha256, crypto.createHash('sha256').update(original).digest('hex'))
    assert.deepEqual(item.data, JSON.parse(original.toString('utf8')))
  }
})

test('source PBF download is the exact recorded input and carries a geographic notice', () => {
  const root = new URL('../', import.meta.url)
  const bundle = JSON.parse(fs.readFileSync(new URL('public/route-data-source.json', root), 'utf8'))
  assert.equal(bundle.sourcePbf.license, 'ODbL-1.0')
  assert.equal(bundle.sourcePbf.bytes, 31679641)
  assert.equal(bundle.sourcePbf.sha256, '35f6a67ad1ab6f356edd55f61afcbdc07994f8363cf011872c1298d2a0e08cc0')
  assert.equal(bundle.sourcePbf.downloadUrl, '/source-data/planet_77.475,12.856_77.742,13.025.osm.pbf')
  const bytes = fs.readFileSync(new URL(bundle.sourcePbf.path, root))
  assert.equal(bytes.length, bundle.sourcePbf.bytes)
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), bundle.sourcePbf.sha256)
  assert.match(fs.readFileSync(new URL('public/source-data/README.md', root), 'utf8'), /OpenStreetMap/)
})
