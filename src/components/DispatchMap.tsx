import { useEffect, useRef, useState } from 'react'
import { Map, Marker, NavigationControl, Popup, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { demoLocations } from '../data/demoLocations'
import type { LocationType } from '../data/demoLocations'
import './DispatchMap.css'
import { delivery } from '../simulation/deliverySimulation'
import type { SimulationState } from '../simulation/deliverySimulation'
import { BUILDING_LAYER_ID, findBuildingSource, hasValidBuilding, buildingExtrusion, cameraDuration } from '../map/buildings'
import { scooterSymbol } from '../map/scooterSymbol'
import { createDeliveryVisuals } from '../map/deliveryVisuals'
import type { DeliveryVisuals } from '../map/deliveryVisuals'
import { roadRoutes } from '../simulation/roadGeometry'

// MapLibre 6 requires an explicit worker URL with Vite. The default URL is
// relative to the library file and breaks when Vite bundles or prebundles it.
// ?worker&url bundles the worker and its dependencies into a local asset.
setWorkerUrl(workerUrl)

const categories: { type: LocationType; label: string; color: string }[] = [
  { type: 'restaurant', label: 'Restaurants', color: '#51dc9c' },
  { type: 'partner', label: 'Delivery partners', color: '#61a7ff' },
  { type: 'order', label: 'Customers / orders', color: '#ffae58' },
]

export default function DispatchMap({ simulation }: { simulation: SimulationState }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const partnerRef = useRef<Marker | null>(null)
  const partnerPopupRef = useRef<Popup | null>(null)
  const partnerDetailRef = useRef<HTMLParagraphElement | null>(null)
  const visualsRef = useRef<DeliveryVisuals | null>(null)
  const [following, setFollowing] = useState(false)
  const [pitched, setPitched] = useState(true)
  const [buildings, setBuildings] = useState('Checking building data…')
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('Loading Bengaluru map…')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let map: Map
    try {
      map = new Map({
        container: containerRef.current,
        style: 'https://tiles.openfreemap.org/styles/dark',
        center: [77.624, 12.938],
        zoom: 14.6, pitch: 48, bearing: -18, maxPitch: 65,
        minZoom: 8,
        maxZoom: 18,
        attributionControl: { compact: false, customAttribution: '<a href="https://maplibre.org/" target="_blank" rel="noreferrer">MapLibre</a>' },
      })
    } catch {
      // Surface initialization failures (for example, unavailable WebGL).
      containerRef.current.insertAdjacentText('beforeend', 'The map could not start. Please enable WebGL and reload.')
      return
    }
    mapRef.current = map
    map.addControl(new NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right')
    const onLoad = () => { setReady(true); setStatus('Drag to explore · Select a marker for details') }
    const onPitch = () => setPitched(map.getPitch() > 1)
    const inspectBuildings = () => {
      const style = map.getStyle()
      const source = findBuildingSource(style)
      if (!source) { setBuildings('3D buildings unavailable: no building vector layer'); return }
      const features = map.querySourceFeatures(source.source, { sourceLayer: source.sourceLayer })
      if (!features.some(hasValidBuilding)) {
        setBuildings(map.getZoom() < 13 ? 'Zoom in to inspect building heights' : '3D buildings unavailable in loaded tiles: no valid heights')
        return
      }
      if (map.getLayer(BUILDING_LAYER_ID)) {
        setBuildings('3D buildings · Provider-supplied heights')
        return
      }
      const label = style.layers.find(layer => layer.type === 'symbol')
      map.addLayer(buildingExtrusion(source.source, source.sourceLayer), label?.id)
      map.setLayoutProperty(BUILDING_LAYER_ID, 'visibility', map.getPitch() > 1 ? 'visible' : 'none')
      setBuildings('3D buildings · Provider-supplied heights')
    }
    const onStyleLoad = () => setBuildings('Checking building data…')
    map.on('idle', inspectBuildings)
    map.on('style.load', onStyleLoad)
    map.on('pitchend', onPitch)
    const onError = () => setStatus('Some map tiles could not load. Check your internet connection and reload if needed.')
    map.on('load', onLoad)
    map.on('error', onError)

    const markers = demoLocations.map(location => {
      const category = categories.find(item => item.type === location.type)!
      const content = document.createElement('div')
      content.className = 'dispatch-popup'
      const heading = document.createElement('h3')
      heading.textContent = location.name
      content.append(heading)
      for (const text of [location.id, location.neighborhood, location.detail, 'Synthetic demonstration data only']) {
        const line = document.createElement('p')
        line.textContent = text
        content.append(line)
      }
      if (location.id === delivery.partner.id) partnerDetailRef.current = content.querySelectorAll('p')[2]
      const popup = new Popup({ offset: 16, maxWidth: '260px' }).setDOMContent(content)
      const element = document.createElement('button')
      element.type = 'button'
      element.className = `dispatch-marker dispatch-marker--${location.type}`
      element.style.setProperty('--marker-color', category.color)
      element.setAttribute('aria-label', `${location.name}, ${location.neighborhood}. Synthetic ${category.label} location. Show details.`)
      element.title = `${location.name} · ${location.neighborhood}`
      const marker = new Marker({ element, anchor: 'center' })
        .setLngLat(location.coordinates).addTo(map)
      if (location.id === delivery.partner.id) {
        partnerRef.current = marker
        partnerPopupRef.current = popup
        element.classList.add('dispatch-marker--selected')
        element.classList.add('dispatch-marker--vehicle')
        element.append(scooterSymbol())
        element.title = `${location.name} · Moving demo scooter · Click for details`
      }
      // Native button click supports pointer, Enter, and Space activation.
      const onClick = (event: MouseEvent) => {
        event.stopPropagation()
        markers.forEach(entry => entry.popup.remove())
        popup.setLngLat(marker.getLngLat()).addTo(map)
      }
      element.addEventListener('click', onClick)
      return { marker, popup, element, onClick }
    })
    const restaurant = markers[demoLocations.findIndex(location => location.id === delivery.restaurant.id)].element
    const customer = markers[demoLocations.findIndex(location => location.id === delivery.customer.id)].element
    if (partnerRef.current) visualsRef.current = createDeliveryVisuals(map, {
      partner: partnerRef.current, restaurant, customer,
    }, setFollowing)
    // Sidebar and breakpoint changes can resize the panel without a window resize.
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      visualsRef.current?.dispose()
      visualsRef.current = null
      markers.forEach(({ marker, popup, element, onClick }) => {
        element.removeEventListener('click', onClick)
        popup.remove()
        marker.remove()
      })
      map.off('load', onLoad)
      map.off('idle', inspectBuildings)
      map.off('style.load', onStyleLoad)
      map.off('pitchend', onPitch)
      map.off('error', onError)
      map.remove()
      mapRef.current = null
      partnerRef.current = null
      partnerPopupRef.current = null
      partnerDetailRef.current = null
    }
  }, [])

  // Move the existing partner marker; map initialization never depends on a frame.
  useEffect(() => {
    partnerRef.current?.setLngLat(simulation.position)
    partnerPopupRef.current?.setLngLat(simulation.position)
    if (simulation.status === 'Idle') partnerPopupRef.current?.remove()
    if (partnerDetailRef.current) partnerDetailRef.current.textContent = 'Simulation: ' + simulation.status + (!simulation.running && simulation.status !== 'Idle' && simulation.status !== 'Delivered' ? ' (paused)' : '')
    visualsRef.current?.update(simulation)
  }, [simulation])

  useEffect(() => {
    const map = mapRef.current
    if (map?.getLayer(BUILDING_LAYER_ID)) map.setLayoutProperty(BUILDING_LAYER_ID, 'visibility', pitched ? 'visible' : 'none')
  }, [pitched])
  const duration = () => cameraDuration(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const cameraPadding = () => window.matchMedia('(min-width: 761px)').matches
    ? { top: 230, bottom: 110, left: 55, right: 350 }
    : { top: 145, bottom: 150, left: 35, right: 35 }
  const toggleView = (next: boolean) => {
    setPitched(next)
    mapRef.current?.easeTo({ pitch: next ? 48 : 0, bearing: next ? -18 : 0, duration: duration() })
  }
  const resetView = () => {
    visualsRef.current?.setFollow(false)
    mapRef.current?.flyTo({ center: [77.624, 12.938], zoom: 14.6, padding: 0,
      pitch: pitched ? 48 : 0, bearing: pitched ? -18 : 0, duration: duration() })
  }
  const overview = () => {
    visualsRef.current?.setFollow(false)
    const points = demoLocations.map(location => location.coordinates)
    mapRef.current?.fitBounds([
      [Math.min(...points.map(point => point[0])), Math.min(...points.map(point => point[1]))],
      [Math.max(...points.map(point => point[0])), Math.max(...points.map(point => point[1]))],
    ], { padding: cameraPadding(), pitch: pitched ? 40 : 0, bearing: 0, duration: duration() })
  }
  const focusDelivery = () => {
    visualsRef.current?.setFollow(false)
    const points = [...roadRoutes.pickup.coordinates, ...roadRoutes.delivery.coordinates]
    mapRef.current?.fitBounds([
      [Math.min(...points.map(point => point[0])), Math.min(...points.map(point => point[1]))],
      [Math.max(...points.map(point => point[0])), Math.max(...points.map(point => point[1]))],
    ], { padding: cameraPadding(), maxZoom: 15.8, pitch: pitched ? 48 : 0, bearing: pitched ? -18 : 0, duration: duration() })
  }

  return (
    <div className="dispatch-map">
      <div className="dispatch-map-viewport">
      <div className="camera-toolbar" aria-label="Map camera controls">
        <div className="camera-modes"><button disabled={!ready} aria-pressed={!pitched} onClick={() => toggleView(false)}>2D</button><button disabled={!ready} aria-pressed={pitched} onClick={() => toggleView(true)}>3D view</button></div>
        <button disabled={!ready} onClick={overview}>City overview</button>
        <button disabled={!ready} onClick={focusDelivery}>Focus delivery</button>
        <button disabled={!ready} onClick={resetView}>Reset view</button>
        <button disabled={!ready} aria-pressed={following} onClick={() => visualsRef.current?.setFollow(!following)}>Follow Partner {following ? 'ON' : 'OFF'}</button>
      </div>
      <div className="delivery-route-key" aria-label="Delivery route legend"><span><i className="route-key-pickup" />Pickup · amber / solid</span><span><i className="route-key-delivery" />Delivery · blue / long dash</span><span><i className="route-key-completed" />Completed · teal</span><small>Faint dashed = pending · Bold = active · Cached OSM road geometry · Compressed demo timing</small><small>{following ? 'Following scooter · Pan or zoom to release' : 'Free camera · Follow Partner is optional'}</small></div>
      <div className="map-coordinate-label" aria-hidden="true"><span>BLR / KARNATAKA</span><strong>12.938° N · 77.624° E</strong><small>INITIAL CAMERA CENTRE</small></div>
      <div className="dispatch-map-legend" aria-label="Map legend">
        {categories.map(category => <span key={category.type}><i style={{ background: category.color }} aria-hidden="true" />{category.label}<strong>{demoLocations.filter(location => location.type === category.type).length}</strong></span>)}
        <span className="dispatch-map-synthetic">Synthetic locations only</span>
      </div>
      <div className="dispatch-map-container" ref={containerRef} role="region" aria-label="Interactive Bengaluru map with fictional restaurants, delivery partners and orders" aria-describedby="dispatch-map-status" />
      <div className="dispatch-map-help"><p id="dispatch-map-status" role="status">{status}</p><span>{pitched ? buildings : '2D view · Building extrusions hidden'}</span></div>
      </div>
      <div className="map-data-credits" role="group" aria-label="Map and route attribution">
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
        <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">ODbL 1.0</a>
        <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>
        <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a>
        <a href="https://project-osrm.org/" target="_blank" rel="noreferrer">Routes: local OSRM</a>
        <a href="/route-data-source.json" download>Route data (ODbL)</a>
        <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Fix the map</a>
        <a href="https://maplibre.org/" target="_blank" rel="noreferrer">MapLibre</a>
      </div>
    </div>
  )
}






