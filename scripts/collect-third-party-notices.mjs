import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
const rows = [], texts = []
for (const [location, record] of Object.entries(lock.packages)) {
  if (!location || record.dev || record.devOptional) continue
  const directory = path.join(root, location)
  if (!fs.existsSync(path.join(directory, 'package.json'))) throw new Error('Missing runtime package: ' + location)
  const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'))
  if (pkg.version !== record.version) throw new Error('Version mismatch: ' + location)
  const legalFiles = fs.readdirSync(directory).filter(name => /^(license|licence|copying|notice)([.-]|$)/i.test(name) && fs.statSync(path.join(directory, name)).isFile())
  if (pkg.name === 'murmurhash-js') {
    const readme = fs.readFileSync(path.join(directory, 'README.md'), 'utf8')
    if (!readme.includes('## License (MIT)') || !readme.includes('Copyright (c) 2011 Gary Court')) throw new Error('Expected embedded license missing')
    legalFiles.push('README.md')
  }
  const files = legalFiles.map(name => {
    const bytes = fs.readFileSync(path.join(directory, name))
    texts.push('PACKAGE: ' + pkg.name + '@' + pkg.version + '\nSOURCE: ' + location + '/' + name + '\n\n' + bytes.toString('utf8'))
    return { name, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }
  })
  rows.push({ name: pkg.name, version: pkg.version, license: pkg.license || record.license || 'UNSPECIFIED', repository: pkg.repository || null, location, legalFiles: files })
}
const intro = 'THIRD-PARTY RUNTIME NOTICE INVENTORY\nGenerated from installed lockfile runtime package legal files; original text follows unchanged.\nCoverage is the declared runtime graph, not proof of every embedded fragment or remote map/font license.\nSee docs/THIRD_PARTY_NOTICES.md and docs/DATA_LICENSES.md.\n'
fs.writeFileSync(path.join(root, 'public/THIRD_PARTY_NOTICES.txt'), intro + '\n' + texts.join('\n\n' + '='.repeat(72) + '\n\n'))
fs.writeFileSync(path.join(root, 'docs/runtime-license-inventory.json'), JSON.stringify(rows, null, 2) + '\n')
console.log('Collected ' + rows.length + ' runtime package records; packages without root legal files: ' + rows.filter(row => !row.legalFiles.length).map(row => row.name).join(', '))
