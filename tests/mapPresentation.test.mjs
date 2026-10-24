import test from 'node:test'
import assert from 'node:assert/strict'
import { findBuildingSource, hasValidBuilding, buildingExtrusion, cameraDuration } from '../src/map/buildings.ts'

const geometry = { type: 'Polygon', coordinates: [[[77.62, 12.93], [77.621, 12.93], [77.621, 12.931], [77.62, 12.93]]] }
const feature = properties => ({ geometry, properties })
test('discovers building source from the loaded style rather than assuming its name', () => {
  const style = { sources: { customProvider: { type: 'vector' } }, layers: [{ id: 'footprints', type: 'fill', source: 'customProvider', 'source-layer': 'building' }] }
  assert.deepEqual(findBuildingSource(style), { source: 'customProvider', sourceLayer: 'building' })
  assert.equal(findBuildingSource({ sources: {}, layers: [] }), null)
  assert.equal(findBuildingSource({ ...style, sources: { customProvider: { type: 'raster' } } }), null)
})
test('accepts observed provider heights and polygon geometry', () => {
  assert.equal(hasValidBuilding(feature({ render_height: 4, render_min_height: 0 })), true)
  assert.equal(hasValidBuilding({ geometry: { type: 'MultiPolygon', coordinates: [] }, properties: { render_height: 8, render_min_height: 2 } }), true)
})
test('rejects missing, zero, invalid, inverted, hidden, or non-polygon building data', () => {
  for (const properties of [{}, { render_height: 0, render_min_height: 0 }, { render_height: '5', render_min_height: 0 }, { render_height: 5 }, { render_height: 5, render_min_height: -1 }, { render_height: 5, render_min_height: 6 }, { render_height: Infinity, render_min_height: 0 }, { render_height: 5, render_min_height: 0, hide_3d: true }]) {
    assert.equal(hasValidBuilding(feature(properties)), false)
  }
  assert.equal(hasValidBuilding({ geometry: { type: 'Point', coordinates: [77.62, 12.93] }, properties: { render_height: 5, render_min_height: 0 } }), false)
})
test('extrusion references only verified provider fields with no positive fallback height', () => {
  const layer = buildingExtrusion('customProvider', 'building')
  assert.equal(layer.type, 'fill-extrusion')
  assert.equal(layer.source, 'customProvider')
  assert.equal(layer['source-layer'], 'building')
  assert.deepEqual(layer.paint['fill-extrusion-height'], ['number', ['get', 'render_height'], 0])
  assert.deepEqual(layer.paint['fill-extrusion-base'], ['number', ['get', 'render_min_height'], 0])
  assert.ok(layer.filter.some(expression => JSON.stringify(expression).includes('hide_3d')))
})
test('camera transitions honor reduced-motion preference', () => {
  assert.equal(cameraDuration(true), 0)
  assert.equal(cameraDuration(false), 1100)
})
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
test('building layer passes the actual MapLibre style validator', () => {
  const errors = validateStyleMin({ version: 8, sources: { verified: { type: 'vector', tiles: ['https://example.com/{z}/{x}/{y}.pbf'] } }, layers: [buildingExtrusion('verified', 'building')] })
  assert.deepEqual(errors.map(error => error.message), [])
})
