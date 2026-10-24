import type { Map, Marker, GeoJSONSource, LineLayerSpecification, MapLibreEvent } from 'maplibre-gl'
import { initialSimulation } from '../simulation/deliverySimulation.ts'
import type { SimulationState } from '../simulation/deliverySimulation.ts'
import { vehicleHeading, routePresentation, followCenter, pickupEffectProgress, shortestTurn } from '../simulation/deliveryPresentation.ts'

const ROUTE_SOURCE = 'dispatch-delivery-route'
export function routeLayers(): LineLayerSpecification[] {
  return (['pickup', 'delivery'] as const).flatMap(leg => (['pending', 'current', 'completed'] as const).map(stage => ({
    id: `dispatch-route-${leg}-${stage}`, type: 'line', source: ROUTE_SOURCE,
    filter: ['all', ['==', ['get', 'leg'], leg], ['==', ['get', 'stage'], stage]],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': stage === 'completed' ? '#8ce2c3' : leg === 'pickup' ? '#f2bc71' : '#92c9ff',
      'line-width': stage === 'current' ? 5 : stage === 'pending' ? 3 : 3.5,
      'line-opacity': stage === 'pending' ? 0.45 : stage === 'completed' ? 0.8 : 1,
      ...(stage === 'pending' ? { 'line-dasharray': leg === 'pickup' ? [1, 2] : [3, 2] }
        : stage === 'current' && leg === 'delivery' ? { 'line-dasharray': [3, 1] } : {}),
    },
  })))
}
interface ExistingMarkers { partner: Marker; restaurant: HTMLElement; customer: HTMLElement }
// Owns presentation resources only. No RAF, timer, simulation mutation, or new marker.
export function createDeliveryVisuals(map: Map, markers: ExistingMarkers, onFollowChange: (following: boolean) => void) {
  let state = initialSimulation()
  let following = false
  let disposed = false
  let completionEffect: Animation | null = null
  let deliveredSeen = false
  let heading = vehicleHeading(0)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const pickupRing = document.createElement('span')
  const deliveredRing = document.createElement('span')
  pickupRing.className = 'milestone-ring milestone-ring--pickup'
  deliveredRing.className = 'milestone-ring milestone-ring--delivery'
  pickupRing.setAttribute('aria-hidden', 'true')
  deliveredRing.setAttribute('aria-hidden', 'true')
  markers.restaurant.append(pickupRing)
  markers.customer.append(deliveredRing)
  markers.partner.setRotationAlignment('map').setPitchAlignment('map').setSubpixelPositioning(true)

  const install = () => {
    if (disposed) return
    if (!map.getSource(ROUTE_SOURCE)) map.addSource(ROUTE_SOURCE, { type: 'geojson', data: routePresentation(state) })
    const before = map.getStyle().layers.find(layer => layer.type === 'symbol')?.id
    for (const layer of routeLayers()) if (!map.getLayer(layer.id)) map.addLayer(layer, before)
  }
  map.on('style.load', install)
  if (map.isStyleLoaded()) install()

  const setFollow = (enabled: boolean) => {
    if (following === enabled) return
    following = enabled
    onFollowChange(enabled)
    map.stop()
    if (enabled) map.easeTo({ center: state.position, zoom: Math.min(16.5, Math.max(15, map.getZoom())),
      padding: window.matchMedia('(min-width: 761px)').matches ? { top: 180, bottom: 100, left: 45, right: 350 } : { top: 120, bottom: 135, left: 20, right: 20 },
      duration: reducedMotion.matches ? 0 : 650 })
  }
  // Programmatic camera events have no originalEvent; real user interaction releases follow.
  const userCamera = (event: MapLibreEvent) => { if (event.originalEvent && following) setFollow(false) }
  map.on('movestart', userCamera)
  map.on('dragstart', userCamera)
  map.on('zoomstart', userCamera)
  map.on('rotatestart', userCamera)
  map.on('pitchstart', userCamera)

  const update = (next: SimulationState) => {
    if (disposed) return
    const previous = state
    state = next
    const delta = next.elapsedMs - previous.elapsedMs
    const targetHeading = vehicleHeading(next.elapsedMs)
    if (next.status === 'Idle') heading = targetHeading
    else if (delta > 0) heading += shortestTurn(heading, targetHeading) * (1 - Math.exp(-delta / 90))
    markers.partner.setRotation(heading)
    const source = map.getSource(ROUTE_SOURCE) as GeoJSONSource | undefined
    if (next.elapsedMs !== previous.elapsedMs || next.status !== previous.status) source?.setData(routePresentation(next))
    const pickup = pickupEffectProgress(next)
    pickupRing.style.opacity = pickup === null ? '0' : String(reducedMotion.matches ? 0.5 : Math.sin(Math.PI * pickup) * 0.8)
    pickupRing.style.transform = `translate(-50%, -50%) scale(${reducedMotion.matches ? 1 : 0.7 + (pickup ?? 0) * 1.1})`
    if (next.status === 'Idle') {
      setFollow(false)
      completionEffect?.cancel()
      completionEffect = null
      deliveredSeen = false
      deliveredRing.style.opacity = '0'
      // Delivery Reset also resets camera state, unlike Pause/Resume.
      map.stop()
      map.jumpTo({ center: [77.624, 12.938], zoom: 14.6, pitch: 48, bearing: -18, padding: { top: 0, bottom: 0, left: 0, right: 0 } })
    }
    if (next.status === 'Delivered' && !deliveredSeen) {
      deliveredSeen = true
      // One finite decorative arrival flourish AFTER the terminal simulation event.
      // Native compositor animation only; it never advances the simulation clock.
      completionEffect = deliveredRing.animate(reducedMotion.matches
        ? [{ opacity: 0.65 }, { opacity: 0 }]
        : [{ opacity: 0, transform: 'translate(-50%, -50%) scale(.65)' },
          { opacity: 0.8, offset: 0.2 }, { opacity: 0, transform: 'translate(-50%, -50%) scale(2)' }],
      { duration: reducedMotion.matches ? 350 : 1200, iterations: 1, fill: 'forwards' })
    }
    if (following && delta > 0 && !map.isMoving()) {
      const center = map.getCenter()
      // Per-frame jumpTo uses simulation-delta exponential damping, not a fresh easeTo.
      map.jumpTo({ center: reducedMotion.matches || next.status === 'Delivered' ? next.position
        : followCenter([center.lng, center.lat], next.position, delta) })
    }
    if (!next.running && next.status !== 'Idle' && previous.running) {
      // A Pause freezes any finite follow-entry transition, too.
      map.stop()
    }
  }
  return {
    update, setFollow,
    dispose: () => {
      disposed = true
      completionEffect?.cancel()
      pickupRing.remove()
      deliveredRing.remove()
      map.off('style.load', install)
      map.off('movestart', userCamera)
      map.off('dragstart', userCamera)
      map.off('zoomstart', userCamera)
      map.off('rotatestart', userCamera)
      map.off('pitchstart', userCamera)
      for (const layer of [...routeLayers()].reverse()) if (map.getLayer(layer.id)) map.removeLayer(layer.id)
      if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE)
    },
  }
}
export type DeliveryVisuals = ReturnType<typeof createDeliveryVisuals>
