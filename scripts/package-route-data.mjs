import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const paths = ['src/data/bengaluru-delivery-roads.json', 'docs/local-routing/local-pickup-evidence.json', 'docs/local-routing/local-delivery-evidence.json']
const datasets = paths.map(location => {
  const bytes = fs.readFileSync(path.join(root, location))
  return { path: location, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), data: JSON.parse(bytes.toString('utf8')) }
})
const sourcePath = 'public/source-data/planet_77.475,12.856_77.742,13.025.osm.pbf'
const sourceBytes = fs.readFileSync(path.join(root, sourcePath))
const sourceHash = crypto.createHash('sha256').update(sourceBytes).digest('hex')
if (sourceHash !== '35f6a67ad1ab6f356edd55f61afcbdc07994f8363cf011872c1298d2a0e08cc0') throw new Error('Source PBF checksum mismatch')
const sourcePbf = { path: sourcePath, downloadUrl: '/source-data/planet_77.475,12.856_77.742,13.025.osm.pbf', sha256: sourceHash, bytes: sourceBytes.length, datasetDate: '2026-10-24T00:00:00Z', source: 'BBBike OpenStreetMap extract', license: 'ODbL-1.0' }
fs.copyFileSync(path.join(root, 'docs/LOCAL_OSRM_REPRODUCTION.md'), path.join(root, 'public/source-data/REPRODUCTION.md'))
fs.copyFileSync(path.join(root, 'docs/DATA_LICENSES.md'), path.join(root, 'public/source-data/DATA_LICENSES.md'))
const contents = {
  title: 'Bengaluru local route dataset source package',
  attribution: 'Geographic data © OpenStreetMap contributors; PBF extraction service BBBike; local routing OSRM Backend.',
  license: 'ODbL-1.0', licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
  copyrightUrl: 'https://www.openstreetmap.org/copyright',
  scope: 'Complete route datasets and a direct checksum-verified original PBF download, offered on applicable ODbL terms. Pinned graph-regeneration instructions are in docs/LOCAL_OSRM_REPRODUCTION.md; no intermediate graph is distributed or claimed legally exempt.',
  reproductionUrl: '/source-data/REPRODUCTION.md',
  dataNoticeUrl: '/source-data/DATA_LICENSES.md',
  sourcePbf,
  datasets,
}
fs.writeFileSync(path.join(root, 'public/route-data-source.json'), JSON.stringify(contents, null, 2) + '\n')
console.log('Packaged all three route datasets for free recipient access at /route-data-source.json')
