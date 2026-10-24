import roadData from './bengaluru-delivery-roads.json' with { type: 'json' }
export type LocationType = 'restaurant' | 'partner' | 'order'
export interface DemoLocation {
  id: string
  type: LocationType
  name: string
  neighborhood: string
  coordinates: [number, number] // Longitude, latitude (MapLibre order).
  detail: string
}

// Fixed fictional points near Bengaluru neighborhoods; these are not real businesses or people.
const restaurants: [string, string, number, number][] = [
  ['Demo Garden Kitchen', 'Koramangala', 77.622, 12.935],
  ['Demo Mango Bowl', 'Indiranagar', 77.641, 12.978],
  ['Demo Tiffin Corner', 'Jayanagar', 77.581, 12.925],
  ['Demo Millet House', 'HSR Layout', 77.647, 12.911],
  ['Demo Saffron Table', 'Whitefield', 77.749, 12.969],
  ['Demo Pepper Pantry', 'JP Nagar', 77.584, 12.906],
  ['Demo Basil Box', 'BTM Layout', 77.61, 12.916],
  ['Demo Urban Thali', 'Domlur', 77.638, 12.961],
]
const partners: [string, number, number][] = [
  ['Koramangala', 77.616, 12.939], ['Koramangala', 77.629, 12.931],
  ['Indiranagar', 77.636, 12.981], ['Indiranagar', 77.648, 12.975],
  ['Jayanagar', 77.578, 12.931], ['Jayanagar', 77.589, 12.921],
  ['HSR Layout', 77.641, 12.916], ['HSR Layout', 77.653, 12.907],
  ['Whitefield', 77.742, 12.974], ['Whitefield', 77.756, 12.965],
  ['JP Nagar', 77.579, 12.912], ['JP Nagar', 77.592, 12.902],
  ['BTM Layout', 77.615, 12.92], ['Domlur', 77.643, 12.957],
  ['Ulsoor', 77.624, 12.985],
]
const orders: [string, number, number][] = [
  ['Koramangala', 77.625, 12.942], ['Koramangala', 77.619, 12.928],
  ['Indiranagar', 77.644, 12.985], ['Indiranagar', 77.633, 12.973],
  ['Jayanagar', 77.574, 12.924], ['Jayanagar', 77.586, 12.934],
  ['HSR Layout', 77.65, 12.919], ['HSR Layout', 77.639, 12.905],
  ['Whitefield', 77.752, 12.978], ['Whitefield', 77.739, 12.963],
  ['JP Nagar', 77.587, 12.913], ['JP Nagar', 77.576, 12.9],
]
const originalLocations: DemoLocation[] = [
  ...restaurants.map(([name, neighborhood, lng, lat], index): DemoLocation => ({
    id: `REST-${index + 1}`, type: 'restaurant', name, neighborhood,
    coordinates: [lng, lat], detail: 'Fictional restaurant · Sample pickup location',
  })),
  ...partners.map(([neighborhood, lng, lat], index): DemoLocation => ({
    id: `PARTNER-${index + 1}`, type: 'partner', name: `Demo Partner ${String(index + 1).padStart(2, '0')}`,
    neighborhood, coordinates: [lng, lat], detail: 'Sample status: Available · Stationary demo point',
  })),
  ...orders.map(([neighborhood, lng, lat], index): DemoLocation => ({
    id: `ORDER-${index + 1}`, type: 'order', name: `Demo Order ${String(index + 1).padStart(2, '0')}`,
    neighborhood, coordinates: [lng, lat], detail: 'Fictional customer · Sample delivery destination',
  })),
]

// Only the three selected synthetic points are adjusted to OSRM road-access points.
// Original coordinates and exact snap distances are preserved in the GeoJSON metadata.
export const demoLocations: DemoLocation[] = originalLocations.map(location => {
  const waypoint = roadData.metadata.waypoints.find(point => point.id === location.id)
  return waypoint ? { ...location, coordinates: [waypoint.snapped[0], waypoint.snapped[1]],
    detail: `${location.detail} · Road-snapped demo point (${waypoint.snapDistanceMeters.toFixed(1)} m adjustment)` } : location
})
