import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import data from '../src/data/bengaluru-delivery-roads.json' with { type: 'json' }
import { demoLocations } from '../src/data/demoLocations.ts'
import { roadRoutes, buildRoadPath, positionAtDistance, positionOnRoad, splitRoadPath, distanceMeters, headingOnRoad } from '../src/simulation/roadGeometry.ts'
import { initialSimulation, controlSimulation, advanceSimulation, delivery } from '../src/simulation/deliverySimulation.ts'
import { routePresentation } from '../src/simulation/deliveryPresentation.ts'

test('cached road endpoints equal snapped existing markers and connect exactly at pickup', () => {
  assert.deepEqual(roadRoutes.pickup.coordinates[0], delivery.partner.coordinates)
  assert.deepEqual(roadRoutes.pickup.coordinates.at(-1), delivery.restaurant.coordinates)
  assert.deepEqual(roadRoutes.delivery.coordinates[0], delivery.restaurant.coordinates)
  assert.deepEqual(roadRoutes.delivery.coordinates.at(-1), delivery.customer.coordinates)
  assert.equal(demoLocations.length, 35)
  assert.equal(demoLocations.filter(point => point.type === 'partner').length, 15)
  assert.equal(demoLocations.filter(point => point.detail.includes('Road-snapped')).length, 3)
  assert.deepEqual(demoLocations.find(point => point.id === 'PARTNER-2').coordinates, [77.629, 12.931])
  for (const point of data.metadata.waypoints) {
    assert.ok(distanceMeters(point.original, point.snapped) < 40)
    assert.ok(Math.abs(distanceMeters(point.original, point.snapped) - point.snapDistanceMeters) < 0.2)
  }
})
test('stored geometry is exactly the returned full OSRM road geometry, not constructed curves', () => {
  for (const [index, name] of ['pickup', 'delivery'].entries()) {
    const raw = JSON.parse(fs.readFileSync(new URL(`../docs/local-routing/local-${name}-evidence.json`, import.meta.url), 'utf8').replace(/^\uFEFF/, ''))
    assert.equal(raw.code, 'Ok')
    assert.equal(raw.routes.length, 1)
    const route = raw.routes[0]
    assert.equal(route.legs.length, 1)
    assert.equal(route.geometry.type, 'LineString')
    const path = roadRoutes[name]
    const feature = data.features.find(feature => feature.properties.leg === name)
    assert.deepEqual(path.coordinates, route.geometry.coordinates)
    assert.equal(path.coordinates.length, [35, 40][index])
    assert.ok(path.coordinates.length >= 30)
    assert.equal(feature.properties.osrmDistanceMeters, route.distance)
    assert.equal(feature.properties.osrmDurationSeconds, route.duration)
    assert.equal(raw.waypoints.length, 2)
    assert.deepEqual(path.coordinates[0], raw.waypoints[0].location)
    assert.deepEqual(path.coordinates.at(-1), raw.waypoints[1].location)
    for (const [longitude, latitude] of path.coordinates) {
      assert.ok(Number.isFinite(longitude) && longitude >= 77.475 && longitude <= 77.742)
      assert.ok(Number.isFinite(latitude) && latitude >= 12.856 && latitude <= 13.025)
    }
    const leg = route.legs[0]
    assert.equal(leg.distance, route.distance)
    assert.ok(leg.steps.length >= 2)
    assert.ok(leg.steps.every(step => step.geometry.type === 'LineString'))
    assert.deepEqual(leg.steps[0].geometry.coordinates[0], path.coordinates[0])
    assert.deepEqual(leg.steps.at(-1).geometry.coordinates.at(-1), path.coordinates.at(-1))
    const stepCoordinates = leg.steps.flatMap(step => step.geometry.coordinates)
      .filter((point, index, all) => index === 0 || point[0] !== all[index - 1][0] || point[1] !== all[index - 1][1])
    assert.deepEqual(stepCoordinates, path.coordinates)
    assert.equal(leg.annotation.distance.length, path.coordinates.length - 1)
    for (let edge = 0; edge < path.coordinates.length - 1; edge++) {
      const measured = distanceMeters(path.coordinates[edge], path.coordinates[edge + 1])
      assert.ok(Math.abs(measured - leg.annotation.distance[edge]) < Math.max(1, measured * 0.02))
    }
    assert.ok(Math.abs(path.totalMeters - leg.distance) / leg.distance < 0.02)
    assert.ok(leg.annotation.nodes.length > 0)
    assert.ok(leg.annotation.nodes.every(node => Number.isSafeInteger(node) && node > 0))
    for (let step = 1; step < leg.steps.length; step++) {
      assert.deepEqual(leg.steps[step - 1].geometry.coordinates.at(-1), leg.steps[step].geometry.coordinates[0])
    }
  }
})
test('distance-based interpolation handles very uneven vertex spacing', () => {
  const path = buildRoadPath([[77, 13], [77.001, 13], [77.01, 13]])
  const midpoint = positionOnRoad(path, 0.5)
  assert.ok(Math.abs(midpoint[0] - 77.005) < 1e-9)
  assert.notDeepEqual(midpoint, path.coordinates[1], 'half the distance is not half the vertex count')
  assert.deepEqual(positionAtDistance(path, -100), path.coordinates[0])
  assert.deepEqual(positionAtDistance(path, 100000), path.coordinates.at(-1))
})
test('sampling and slicing retain every road turn and split at the vehicle position', () => {
  for (const path of Object.values(roadRoutes)) {
    for (let index = 0; index < path.coordinates.length; index++) {
      assert.ok(distanceMeters(positionAtDistance(path, path.cumulativeMeters[index]), path.coordinates[index]) < 1e-6)
    }
    for (const fraction of [0.01, 0.2, 0.5, 0.99]) {
      const { completed, remaining } = splitRoadPath(path, fraction)
      assert.deepEqual(completed.at(-1), positionOnRoad(path, fraction))
      assert.deepEqual(remaining[0], positionOnRoad(path, fraction))
      assert.ok(Math.abs(buildRoadPath(completed).totalMeters - path.totalMeters * fraction) < 0.05)
      const merged = [...completed, ...remaining.slice(1)]
      for (const vertex of path.coordinates) assert.ok(merged.some(point => point[0] === vertex[0] && point[1] === vertex[1]))
    }
  }
})
test('road progress is continuous at pickup, departure and delivery and time stays demo time', () => {
  const start = controlSimulation(initialSimulation(), 'start')
  for (const boundary of [12000, 14000, 30000]) {
    const before = advanceSimulation(start, boundary - 0.01)
    const after = advanceSimulation(start, boundary)
    assert.ok(distanceMeters(before.position, after.position) < 0.01)
  }
  assert.equal(advanceSimulation(start, 12000).status, 'Picked up')
  assert.equal(advanceSimulation(start, 14000).status, 'Heading to customer')
  const done = advanceSimulation(start, 30000)
  assert.equal(done.status, 'Delivered')
  assert.deepEqual(done.position, delivery.customer.coordinates)
  assert.equal(done.elapsedMs, 30000)
  assert.deepEqual(routePresentation(done).features.map(point => point.properties.stage), ['completed', 'completed'])
})
test('reset after a road leg restores exact start, both full pending roads and empty events', () => {
  const start = controlSimulation(initialSimulation(), 'start')
  for (const elapsed of [6000, 13000, 23000, 30000]) {
    const reset = controlSimulation(advanceSimulation(start, elapsed), 'reset')
    assert.deepEqual(reset, initialSimulation())
    assert.deepEqual(routePresentation(reset).features.map(feature => feature.geometry.coordinates), [roadRoutes.pickup.coordinates, roadRoutes.delivery.coordinates])
    assert.equal(advanceSimulation(reset, 1000), reset)
  }
})
test('road tangent bearings are finite and match each local street segment', () => {
  for (const path of Object.values(roadRoutes)) {
    const angles = Array.from({ length: 101 }, (_, index) => headingOnRoad(path, index / 100))
    assert.ok(angles.every(angle => Number.isFinite(angle) && angle >= 0 && angle < 360))
    assert.ok(new Set(angles.map(angle => Math.round(angle))).size > 5, 'vehicle direction must turn with the roads')
  }
})
test('invalid geometry fails explicitly without inventing a straight-line fallback', () => {
  for (const geometry of [[], [[77, 13]], [[NaN, 13], [77, 13]], [[77, 13], [77, 13]], [[181, 13], [77, 13]]]) assert.throws(() => buildRoadPath(geometry))
  const path = buildRoadPath([[77, 13], [77, 13], [77.001, 13]])
  assert.equal(path.coordinates.length, 2)
  assert.throws(() => positionAtDistance(path, NaN))
})

test('the active vehicle takes road detours instead of the original endpoint chord', () => {
  const start = controlSimulation(initialSimulation(), 'start')
  for (const [elapsed, from, to] of [[6000, delivery.partner.coordinates, delivery.restaurant.coordinates], [22000, delivery.restaurant.coordinates, delivery.customer.coordinates]]) {
    const vehicle = advanceSimulation(start, elapsed).position
    const chordMidpoint = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
    assert.ok(distanceMeters(vehicle, chordMidpoint) > 10)
  }
  for (let elapsed = 75; elapsed < 30000; elapsed += 75) {
    const position = advanceSimulation(start, elapsed).position
    const path = elapsed < 14000 ? roadRoutes.pickup : roadRoutes.delivery
    assert.ok(path.coordinates.slice(1).some((end, index) => {
      const from = path.coordinates[index]
      return Math.abs(distanceMeters(from, position) + distanceMeters(position, end) - distanceMeters(from, end)) < 0.02
    }), 'every sampled position must lie on an original road edge')
  }
})

test('waypoint IDs are unique and snap distances are finite and nonnegative', () => {
  assert.equal(data.metadata.waypoints.length, 3)
  for (const id of ['PARTNER-1', 'REST-1', 'ORDER-1']) {
    const matches = data.metadata.waypoints.filter(point => point.id === id)
    assert.equal(matches.length, 1)
    assert.ok(Number.isFinite(matches[0].snapDistanceMeters) && matches[0].snapDistanceMeters >= 0)
  }
})

test('release snapshot excludes historical response and legacy generator', () => {
  assert.equal(fs.existsSync(new URL('../docs/road-routing-response.json', import.meta.url)), false)
  assert.equal(fs.existsSync(new URL('../scripts/prepare-road-routes.mjs', import.meta.url)), false)
  assert.ok(data.metadata.waypoints.every(point => !('roadName' in point)))
})
