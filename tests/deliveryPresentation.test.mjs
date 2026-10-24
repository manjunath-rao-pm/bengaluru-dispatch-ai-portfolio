import test from 'node:test'
import assert from 'node:assert/strict'
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { initialSimulation, controlSimulation, advanceSimulation, delivery } from '../src/simulation/deliverySimulation.ts'
import { routePresentation, vehicleHeading, shortestTurn, followCenter, pickupEffectProgress } from '../src/simulation/deliveryPresentation.ts'
import { routeLayers, createDeliveryVisuals } from '../src/map/deliveryVisuals.ts'
import { roadRoutes } from '../src/simulation/roadGeometry.ts'

const start = () => controlSimulation(initialSimulation(), 'start')
const at = elapsedMs => advanceSimulation(start(), elapsedMs)

test('idle and reset show exactly two pending geographical segments', () => {
  const initial = routePresentation(initialSimulation())
  assert.deepEqual(initial.features.map(feature => feature.properties.stage), ['pending', 'pending'])
  assert.deepEqual(initial.features[0].geometry.coordinates, roadRoutes.pickup.coordinates)
  assert.deepEqual(initial.features[1].geometry.coordinates, roadRoutes.delivery.coordinates)
  assert.deepEqual(routePresentation(controlSimulation(at(25000), 'reset')), initial)
})
test('completed and active route share the exact existing vehicle position on both legs', () => {
  for (const [elapsed, leg] of [[6000, 'pickup'], [22000, 'delivery']]) {
    const state = at(elapsed)
    const features = routePresentation(state).features.filter(feature => feature.properties.leg === leg)
    assert.equal(features.length, 2)
    assert.deepEqual(features[0].geometry.coordinates.at(-1), state.position)
    assert.deepEqual(features[1].geometry.coordinates[0], state.position)
    assert.deepEqual(features.map(feature => feature.properties.stage), ['completed', 'current'])
  }
})
test('pickup dwell, departure, and arrival keep geometry continuous and preserve lifecycle timing', () => {
  for (const elapsed of [12000, 13000]) {
    assert.deepEqual(at(elapsed).position, delivery.restaurant.coordinates)
    assert.deepEqual(routePresentation(at(elapsed)).features.map(feature => feature.properties.stage), ['completed', 'pending'])
  }
  assert.deepEqual(routePresentation(at(14000)).features.map(feature => feature.properties.stage), ['completed', 'current'])
  assert.deepEqual(routePresentation(at(30000)).features.map(feature => feature.properties.stage), ['completed', 'completed'])
  assert.deepEqual(at(30000).position, delivery.customer.coordinates)
})
test('pause freezes route, heading and milestone progress; resume uses the same clock', () => {
  const moving = at(12800)
  const paused = controlSimulation(moving, 'pause')
  const later = advanceSimulation(paused, 50000)
  assert.deepEqual(routePresentation(later), routePresentation(moving))
  assert.equal(vehicleHeading(later.elapsedMs), vehicleHeading(moving.elapsedMs))
  assert.equal(pickupEffectProgress(later), pickupEffectProgress(moving))
  assert.equal(advanceSimulation(controlSimulation(later, 'resume'), 200).elapsedMs, 13000)
  assert.equal(pickupEffectProgress(controlSimulation(later, 'reset')), null)
})
test('heading makes a smooth shortest turn without changing geographical position', () => {
  assert.equal(shortestTurn(350, 10), 20)
  assert.equal(shortestTurn(10, 350), -20)
  assert.ok(Number.isFinite(vehicleHeading(0)))
  assert.ok(Number.isFinite(vehicleHeading(30000)))
  const midpoint = vehicleHeading(13000)
  assert.ok(Math.abs(shortestTurn(vehicleHeading(12000), midpoint) - shortestTurn(vehicleHeading(12000), vehicleHeading(14000)) / 2) < 1e-10)
  assert.ok(Math.abs(vehicleHeading(12001) - vehicleHeading(12000)) < 0.001)
  assert.ok(Math.abs(vehicleHeading(14000) - vehicleHeading(13999)) < 0.001)
})
test('route and follow damping are frame-rate independent', () => {
  let state = start()
  for (let frame = 0; frame < 120; frame++) state = advanceSimulation(state, 100)
  assert.deepEqual(routePresentation(state), routePresentation(at(12000)))
  const from = [77.6, 12.9], target = [77.62, 12.94]
  let fine = from
  for (let index = 0; index < 10; index++) fine = followCenter(fine, target, 10)
  const coarse = followCenter(from, target, 100)
  assert.ok(Math.abs(fine[0] - coarse[0]) < 1e-10)
  assert.ok(Math.abs(fine[1] - coarse[1]) < 1e-10)
  assert.deepEqual(followCenter(from, target, 0), from)
})
test('all route layers pass MapLibre validation and distinguish stage and leg', () => {
  const layers = routeLayers()
  assert.equal(new Set(layers.map(layer => layer.id)).size, 6)
  const errors = validateStyleMin({ version: 8, sources: { 'dispatch-delivery-route': { type: 'geojson', data: routePresentation(start()) } }, layers })
  assert.deepEqual(errors.map(error => error.message), [])
})

// Presentation integration doubles: no browser, network, new map, or RAF required.
function fixture() {
  const animations = []
  function element() {
    return { style: {}, children: [], setAttribute() {}, append(child) { this.children.push(child) },
      remove() { this.removed = true }, animate() { const animation = { cancelled: false, cancel() { this.cancelled = true } }; animations.push(animation); return animation } }
  }
  const sources = new Map(), layers = new Map(), listeners = new Map(), jumps = [], eases = []
  const map = {
    center: [77.624, 12.938], stops: 0,
    on(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn) },
    off(name, fn) { listeners.get(name)?.delete(fn) },
    getSource(id) { return sources.get(id) },
    addSource(id, spec) { sources.set(id, { data: spec.data, updates: 0, setData(data) { this.data = data; this.updates++ } }) },
    getLayer(id) { return layers.get(id) }, addLayer(layer) { layers.set(layer.id, layer) }, removeLayer(id) { layers.delete(id) }, removeSource(id) { sources.delete(id) },
    isStyleLoaded() { return true }, getStyle() { return { layers: [] } },
    getCenter() { return { lng: this.center[0], lat: this.center[1] } }, getZoom() { return 15 }, isMoving() { return false },
    stop() { this.stops++ }, easeTo(options) { eases.push(options); this.center = options.center ?? this.center },
    jumpTo(options) { jumps.push(options); this.center = options.center ?? this.center },
  }
  const partner = { rotation: 0, setRotationAlignment() { return this }, setPitchAlignment() { return this }, setSubpixelPositioning() { return this }, setRotation(rotation) { this.rotation = rotation } }
  return { map, partner, restaurant: element(), customer: element(), sources, layers, listeners, jumps, eases, animations, element }
}

test('presentation reset and cleanup remove effects, disable follow and restore camera and route without duplicates', () => {
  const oldWindow = globalThis.window, oldDocument = globalThis.document
  const fixtureData = fixture()
  globalThis.window = { matchMedia: () => ({ matches: false }) }
  globalThis.document = { createElement: fixtureData.element }
  try {
    const following = []
    const { map, partner, restaurant, customer, sources, layers, listeners, jumps, eases, animations } = fixtureData
    const visuals = createDeliveryVisuals(map, { partner, restaurant, customer }, value => following.push(value))
    assert.equal(sources.size, 1)
    assert.equal(layers.size, 6)
    for (const fn of listeners.get('style.load')) fn()
    assert.equal(sources.size, 1)
    assert.equal(layers.size, 6)
    visuals.update(start())
    visuals.setFollow(true)
    assert.deepEqual(following, [true])
    assert.equal(eases.length, 1)
    visuals.update(at(1000))
    visuals.update(at(2000))
    assert.equal(eases.length, 1, 'follow does not restart eased animations on each frame')
    const paused = controlSimulation(at(2000), 'pause')
    visuals.update(paused)
    const frozen = sources.get('dispatch-delivery-route').updates
    visuals.update(paused)
    assert.equal(sources.get('dispatch-delivery-route').updates, frozen)
    const jumpCount = jumps.length
    for (const fn of listeners.get('dragstart')) fn({ originalEvent: {} })
    assert.deepEqual(following, [true, false])
    visuals.update(at(3000))
    assert.equal(jumps.length, jumpCount, 'manual navigation is not pulled back')
    visuals.update(at(30000))
    visuals.update(at(30000))
    assert.equal(animations.length, 1, 'delivery effect plays once')
    visuals.update(initialSimulation())
    assert.equal(animations[0].cancelled, true)
    assert.deepEqual(jumps.at(-1).center, [77.624, 12.938])
    assert.equal(jumps.at(-1).pitch, 48)
    assert.equal(partner.rotation, vehicleHeading(0))
    assert.deepEqual(sources.get('dispatch-delivery-route').data, routePresentation(initialSimulation()))
    visuals.update(start())
    visuals.update(at(30000))
    assert.equal(animations.length, 2, 'a new run may play the effect again')
    visuals.dispose()
    assert.equal(sources.size, 0)
    assert.equal(layers.size, 0)
    assert.ok([...listeners.values()].every(list => list.size === 0))
    assert.equal(animations[1].cancelled, true)
    assert.equal(restaurant.children[0].removed, true)
    assert.equal(customer.children[0].removed, true)
  } finally { globalThis.window = oldWindow; globalThis.document = oldDocument }
})

test('style reload restores latest route once and disposal allows a clean remount', () => {
  const oldWindow = globalThis.window, oldDocument = globalThis.document
  const data = fixture()
  globalThis.window = { matchMedia: () => ({ matches: false }) }
  globalThis.document = { createElement: data.element }
  try {
    const { map, partner, restaurant, customer, sources, layers, listeners } = data
    const visuals = createDeliveryVisuals(map, { partner, restaurant, customer }, () => {})
    visuals.update(at(22000))
    sources.clear(); layers.clear()
    for (const fn of listeners.get('style.load')) fn()
    assert.equal(layers.size, 6)
    assert.deepEqual(sources.get('dispatch-delivery-route').data, routePresentation(at(22000)))
    visuals.dispose()
    const remount = createDeliveryVisuals(map, { partner, restaurant, customer }, () => {})
    assert.equal(sources.size, 1)
    assert.equal(layers.size, 6)
    assert.ok([...listeners.values()].every(list => list.size === 1))
    remount.dispose()
    assert.ok([...listeners.values()].every(list => list.size === 0))
  } finally { globalThis.window = oldWindow; globalThis.document = oldDocument }
})
test('reduced motion uses an immediate follow entry and a restrained pickup cue', () => {
  const oldWindow = globalThis.window, oldDocument = globalThis.document
  const data = fixture()
  globalThis.window = { matchMedia: query => ({ matches: query.includes('prefers-reduced-motion') }) }
  globalThis.document = { createElement: data.element }
  try {
    const visuals = createDeliveryVisuals(data.map, data, () => {})
    visuals.update(at(12500))
    assert.equal(data.restaurant.children[0].style.opacity, '0.5')
    visuals.setFollow(true)
    assert.equal(data.eases[0].duration, 0)
    visuals.update(at(13000))
    assert.deepEqual(data.jumps.at(-1).center, at(13000).position)
    visuals.dispose()
  } finally { globalThis.window = oldWindow; globalThis.document = oldDocument }
})


