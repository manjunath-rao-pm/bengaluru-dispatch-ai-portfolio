import type { FeatureCollection, LineString } from 'geojson'
import { timing } from './deliverySimulation.ts'
import type { SimulationState } from './deliverySimulation.ts'
import { roadRoutes, splitRoadPath, headingOnRoad } from './roadGeometry.ts'
export { geographicalHeading } from './roadGeometry.ts'
export type { Coordinate } from './roadGeometry.ts'
import type { Coordinate } from './roadGeometry.ts'

export function shortestTurn(from: number, to: number) { return ((to - from + 180) % 360 + 360) % 360 - 180 }
export function vehicleHeading(elapsedMs: number): number {
  if (elapsedMs < timing.pickupMs) return headingOnRoad(roadRoutes.pickup, elapsedMs / timing.pickupMs)
  if (elapsedMs >= timing.departureMs) return headingOnRoad(roadRoutes.delivery, (elapsedMs - timing.departureMs) / (timing.deliveredMs - timing.departureMs))
  const incoming = headingOnRoad(roadRoutes.pickup, 1), outgoing = headingOnRoad(roadRoutes.delivery, 0)
  const fraction = (elapsedMs - timing.pickupMs) / (timing.departureMs - timing.pickupMs)
  return incoming + shortestTurn(incoming, outgoing) * fraction * fraction * (3 - 2 * fraction)
}
export function followCenter(current: Coordinate, target: Coordinate, deltaMs: number): Coordinate {
  const alpha = 1 - Math.exp(-Math.max(0, deltaMs) / 180)
  return [current[0] + (target[0] - current[0]) * alpha, current[1] + (target[1] - current[1]) * alpha]
}
export interface RouteProperties { leg: 'pickup' | 'delivery'; stage: 'pending' | 'current' | 'completed' }
export function routePresentation(state: SimulationState): FeatureCollection<LineString, RouteProperties> {
  const features: FeatureCollection<LineString, RouteProperties>['features'] = []
  const legs = [
    { leg: 'pickup' as const, path: roadRoutes.pickup, start: 0, end: timing.pickupMs },
    { leg: 'delivery' as const, path: roadRoutes.delivery, start: timing.departureMs, end: timing.deliveredMs },
  ]
  for (const leg of legs) {
    const fraction = Math.max(0, Math.min(1, (state.elapsedMs - leg.start) / (leg.end - leg.start)))
    const split = splitRoadPath(leg.path, fraction)
    const add = (coordinates: Coordinate[], stage: RouteProperties['stage']) => features.push({
      type: 'Feature', properties: { leg: leg.leg, stage }, geometry: { type: 'LineString', coordinates },
    })
    if (split.completed.length >= 2) add(split.completed, 'completed')
    if (split.remaining.length >= 2) add(split.remaining, state.status !== 'Idle' && state.elapsedMs >= leg.start ? 'current' : 'pending')
  }
  return { type: 'FeatureCollection', features }
}
export function pickupEffectProgress(state: SimulationState): number | null {
  if (state.elapsedMs < timing.pickupMs || state.elapsedMs >= timing.departureMs) return null
  return (state.elapsedMs - timing.pickupMs) / (timing.departureMs - timing.pickupMs)
}
