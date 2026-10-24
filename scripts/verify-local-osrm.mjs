// Read-only exact comparison against a running local engine; never overwrites evidence or production.
import fs from 'node:fs'
import assert from 'node:assert/strict'
const fixture = JSON.parse(fs.readFileSync(new URL('../src/data/bengaluru-delivery-roads.json', import.meta.url), 'utf8'))
const requests = [
  ['pickup', '77.616,12.939;77.622,12.935'],
  ['delivery', '77.622,12.935;77.625,12.942'],
]
for (const [name, coordinates] of requests) {
  const url = 'http://127.0.0.1:5000/route/v1/driving/' + coordinates + '?overview=full&geometries=geojson&steps=true&annotations=nodes,distance'
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
  assert.ok(response.ok, name + ': HTTP error ' + response.status)
  const raw = await response.json()
  assert.equal(raw.code, 'Ok')
  assert.equal(raw.routes.length, 1)
  assert.equal(raw.routes[0].legs.length, 1)
  const feature = fixture.features.find(feature => feature.properties.leg === name)
  assert.deepEqual(raw.routes[0].geometry.coordinates, feature.geometry.coordinates, name + ': exact geometry mismatch')
  assert.equal(raw.routes[0].distance, feature.properties.osrmDistanceMeters, name + ': distance mismatch')
  assert.equal(raw.routes[0].duration, feature.properties.osrmDurationSeconds, name + ': duration mismatch')
  assert.equal(feature.geometry.coordinates.length, name === 'pickup' ? 35 : 40)
  console.log(name + ': exact coordinates, distance and duration PASS')
}
