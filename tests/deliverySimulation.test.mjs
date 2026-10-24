import test from 'node:test'
import assert from 'node:assert/strict'
import { advanceSimulation, controlSimulation, initialSimulation, delivery } from '../src/simulation/deliverySimulation.ts'

import { positionOnRoad, roadRoutes } from '../src/simulation/roadGeometry.ts'

const start = () => controlSimulation(initialSimulation(), 'start')
test('starts idle at the existing partner and transitions through every phase', () => {
  assert.equal(initialSimulation().status, 'Idle')
  assert.deepEqual(initialSimulation().position, delivery.partner.coordinates)
  let state = start()
  assert.equal(state.status, 'Heading to pickup')
  state = advanceSimulation(state, 12000)
  assert.equal(state.status, 'Picked up')
  assert.deepEqual(state.position, delivery.restaurant.coordinates)
  state = advanceSimulation(state, 2000)
  assert.equal(state.status, 'Heading to customer')
  state = advanceSimulation(state, 16000)
  assert.equal(state.status, 'Delivered')
  assert.equal(state.running, false)
  assert.deepEqual(state.position, delivery.customer.coordinates)
  assert.deepEqual(state.events.map(event => event.id), ['start', 'pickup', 'departure', 'delivered'])
  assert.equal(advanceSimulation(state, 1000), state)
})
test('interpolates halfway to pickup and customer without mutating input', () => {
  const original = start()
  const halfway = advanceSimulation(original, 6000)
  assert.deepEqual(halfway.position, positionOnRoad(roadRoutes.pickup, 0.5))
  assert.equal(original.elapsedMs, 0)
  const secondLeg = advanceSimulation(original, 22000)
  assert.deepEqual(secondLeg.position, positionOnRoad(roadRoutes.delivery, 0.5))
})
test('pause freezes time and position; resume continues without adding paused time', () => {
  const moving = advanceSimulation(start(), 5000)
  const paused = controlSimulation(moving, 'pause')
  assert.equal(advanceSimulation(paused, 60000), paused)
  const resumed = advanceSimulation(controlSimulation(paused, 'resume'), 1000)
  assert.equal(resumed.elapsedMs, 6000)
  assert.equal(resumed.status, 'Heading to pickup')
  assert.equal(resumed.events.length, 1)
})
test('reset restores exact idle state from running, paused, and delivered', () => {
  for (const state of [advanceSimulation(start(), 7000), controlSimulation(advanceSimulation(start(), 15000), 'pause'), advanceSimulation(start(), 30000)]) {
    const reset = controlSimulation(state, 'reset')
    assert.deepEqual(reset, initialSimulation())
    assert.deepEqual(advanceSimulation(controlSimulation(reset, 'start'), 30000).events.map(event => event.id), ['start', 'pickup', 'departure', 'delivered'])
  }
})
test('elapsed time produces the same result at different frame rates and handles a long frame', () => {
  let fine = start()
  for (let index = 0; index < 300; index++) fine = advanceSimulation(fine, 100)
  assert.deepEqual(fine, advanceSimulation(start(), 60000))
  assert.equal(fine.elapsedMs, 30000)
  assert.deepEqual(fine.events.map(event => event.elapsedMs), [0, 12000, 14000, 30000])
})
test('invalid deltas and invalid controls do not alter state', () => {
  const idle = initialSimulation()
  assert.equal(controlSimulation(idle, 'resume'), idle)
  const running = start()
  for (const delta of [-1, 0, NaN, Infinity]) assert.equal(advanceSimulation(running, delta), running)
  assert.equal(controlSimulation(running, 'start'), running)
  const done = advanceSimulation(running, 30000)
  assert.equal(controlSimulation(done, 'resume'), done)
})

