import routeData from '../data/bengaluru-delivery-roads.json' with { type: 'json' }
export type Coordinate = [number, number]
export interface RoadPath { coordinates: Coordinate[]; cumulativeMeters: number[]; totalMeters: number }
export function distanceMeters(a: Coordinate, b: Coordinate): number {
  const rad = Math.PI / 180
  const dlat = (b[1] - a[1]) * rad, dlon = (b[0] - a[0]) * rad
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dlon / 2) ** 2
  return 6371008.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}
const same = (a: Coordinate, b: Coordinate) => a[0] === b[0] && a[1] === b[1]
export function buildRoadPath(points: readonly number[][]): RoadPath {
  const coordinates: Coordinate[] = [], cumulativeMeters = [0]
  for (const point of points) {
    if (point.length !== 2 || !point.every(Number.isFinite) || Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90) throw new Error('Invalid cached road coordinate')
    const coordinate: Coordinate = [point[0], point[1]]
    if (coordinates.length && same(coordinates.at(-1)!, coordinate)) continue
    if (coordinates.length) cumulativeMeters.push(cumulativeMeters.at(-1)! + distanceMeters(coordinates.at(-1)!, coordinate))
    coordinates.push(coordinate)
  }
  if (coordinates.length < 2 || cumulativeMeters.at(-1)! <= 0) throw new Error('Cached road path has no usable length; no straight-line fallback is allowed')
  return { coordinates, cumulativeMeters, totalMeters: cumulativeMeters.at(-1)! }
}
function cachedPath(leg: string) {
  const feature = routeData.features.find(feature => feature.properties.leg === leg)
  if (!feature || feature.geometry.type !== 'LineString') throw new Error(`Missing cached ${leg} road geometry`)
  return buildRoadPath(feature.geometry.coordinates)
}
export const roadRoutes = { pickup: cachedPath('pickup'), delivery: cachedPath('delivery') }
if (!same(roadRoutes.pickup.coordinates.at(-1)!, roadRoutes.delivery.coordinates[0])) throw new Error('Cached road legs are disconnected')
export function positionAtDistance(path: RoadPath, meters: number): Coordinate {
  if (!Number.isFinite(meters)) throw new Error('Route distance must be finite')
  if (meters <= 0) return [...path.coordinates[0]]
  if (meters >= path.totalMeters) return [...path.coordinates.at(-1)!]
  let left = 0, right = path.coordinates.length - 1
  while (left + 1 < right) {
    const middle = Math.floor((left + right) / 2)
    if (path.cumulativeMeters[middle] <= meters) left = middle
    else right = middle
  }
  const fraction = (meters - path.cumulativeMeters[left]) / (path.cumulativeMeters[right] - path.cumulativeMeters[left])
  const from = path.coordinates[left], to = path.coordinates[right]
  // Interpolate only WITHIN one consecutive original road edge, never across a turn.
  return [from[0] + (to[0] - from[0]) * fraction, from[1] + (to[1] - from[1]) * fraction]
}
export function positionOnRoad(path: RoadPath, fraction: number): Coordinate {
  return positionAtDistance(path, Math.max(0, Math.min(1, fraction)) * path.totalMeters)
}
export function splitRoadPath(path: RoadPath, fraction: number) {
  const meters = Math.max(0, Math.min(1, fraction)) * path.totalMeters
  const position = positionAtDistance(path, meters)
  if (meters <= 0) return { completed: [], remaining: path.coordinates.map(point => [...point] as Coordinate) }
  if (meters >= path.totalMeters) return { completed: path.coordinates.map(point => [...point] as Coordinate), remaining: [] }
  const completed = path.coordinates.filter((_, index) => path.cumulativeMeters[index] < meters).map(point => [...point] as Coordinate)
  const remaining = path.coordinates.filter((_, index) => path.cumulativeMeters[index] > meters).map(point => [...point] as Coordinate)
  completed.push(position)
  remaining.unshift([...position])
  return { completed, remaining }
}
export function geographicalHeading(from: Coordinate, to: Coordinate): number {
  const meanLatitude = (from[1] + to[1]) / 2 * Math.PI / 180
  return (Math.atan2((to[0] - from[0]) * Math.cos(meanLatitude), to[1] - from[1]) * 180 / Math.PI + 360) % 360
}
export function headingOnRoad(path: RoadPath, fraction: number): number {
  const meters = Math.max(0, Math.min(1, fraction)) * path.totalMeters
  // Consecutive nearby samples on the actual polyline soften orientation at corners.
  return geographicalHeading(positionAtDistance(path, Math.max(0, meters - 6)), positionAtDistance(path, Math.min(path.totalMeters, meters + 6)))
}
