import { demoLocations } from '../data/demoLocations.ts'
import type { DemoLocation } from '../data/demoLocations.ts'
import { positionOnRoad, roadRoutes } from './roadGeometry.ts'

function location(id: string): DemoLocation {
  const point = demoLocations.find(item => item.id === id)
  if (!point) throw new Error(`Missing simulation location: ${id}`)
  return point
}
export const delivery = {
  partner: location('PARTNER-1'), restaurant: location('REST-1'), customer: location('ORDER-1'),
}
export const timing = { pickupMs: 12_000, departureMs: 14_000, deliveredMs: 30_000 }
export type DeliveryStatus = 'Idle' | 'Heading to pickup' | 'Picked up' | 'Heading to customer' | 'Delivered'
export interface SimulationEvent { id: string; elapsedMs: number; message: string }
export interface SimulationState {
  status: DeliveryStatus
  running: boolean
  elapsedMs: number
  position: [number, number]
  events: SimulationEvent[]
}
export type SimulationAction = 'start' | 'pause' | 'resume' | 'reset'
export function initialSimulation(): SimulationState {
  return { status: 'Idle', running: false, elapsedMs: 0, position: [...delivery.partner.coordinates], events: [] }
}
export function controlSimulation(state: SimulationState, action: SimulationAction): SimulationState {
  if (action === 'reset') return initialSimulation()
  if (action === 'start' && state.status === 'Idle') {
    return { ...state, running: true, status: 'Heading to pickup', events: [{ id: 'start', elapsedMs: 0, message: 'Demo delivery started. Partner heading to pickup.' }] }
  }
  if (action === 'pause' && state.running) return { ...state, running: false }
  if (action === 'resume' && !state.running && state.status !== 'Idle' && state.status !== 'Delivered') return { ...state, running: true }
  return state
}
// Cached OSM road geometry is independent of these deliberately compressed demo
// durations. Each leg progresses by cumulative metres, not by vertex/frame count.
// Pure transition: deltaMs advances a simulation-owned clock, never Date.now().
// Crossing multiple boundaries in one update still records every milestone once.
export function advanceSimulation(state: SimulationState, deltaMs: number): SimulationState {
  if (!state.running || !Number.isFinite(deltaMs) || deltaMs <= 0) return state
  const elapsedMs = Math.min(state.elapsedMs + deltaMs, timing.deliveredMs)
  const status: DeliveryStatus = elapsedMs < timing.pickupMs ? 'Heading to pickup'
    : elapsedMs < timing.departureMs ? 'Picked up'
      : elapsedMs < timing.deliveredMs ? 'Heading to customer' : 'Delivered'
  const position: [number, number] = elapsedMs < timing.pickupMs
    ? positionOnRoad(roadRoutes.pickup, elapsedMs / timing.pickupMs)
    : elapsedMs < timing.departureMs ? [...delivery.restaurant.coordinates]
      : positionOnRoad(roadRoutes.delivery,
        (elapsedMs - timing.departureMs) / (timing.deliveredMs - timing.departureMs))
  const milestones: SimulationEvent[] = [
    { id: 'pickup', elapsedMs: timing.pickupMs, message: 'Picked up at Demo Garden Kitchen.' },
    { id: 'departure', elapsedMs: timing.departureMs, message: 'Partner heading to Demo Order 01.' },
    { id: 'delivered', elapsedMs: timing.deliveredMs, message: 'Demo Order 01 delivered.' },
  ]
  return {
    status, elapsedMs, position, running: elapsedMs < timing.deliveredMs,
    events: [...state.events, ...milestones.filter(event => state.elapsedMs < event.elapsedMs && elapsedMs >= event.elapsedMs)],
  }
}
