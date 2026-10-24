import type { StyleSpecification, FillExtrusionLayerSpecification, MapGeoJSONFeature } from 'maplibre-gl'

export const BUILDING_LAYER_ID = 'dispatch-verified-buildings'
export function findBuildingSource(style: StyleSpecification) {
  const layer = style.layers.find(layer => layer.type === 'fill' && layer['source-layer'] === 'building'
    && typeof layer.source === 'string' && style.sources[layer.source]?.type === 'vector')
  if (!layer || !('source' in layer) || typeof layer.source !== 'string') return null
  return { source: layer.source, sourceLayer: 'building' }
}
export function hasValidBuilding(feature: Pick<MapGeoJSONFeature, 'geometry' | 'properties'>): boolean {
  const properties = feature.properties
  return (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
    && typeof properties.render_height === 'number' && Number.isFinite(properties.render_height)
    && typeof properties.render_min_height === 'number' && Number.isFinite(properties.render_min_height)
    && properties.render_height > properties.render_min_height && properties.render_min_height >= 0
    && properties.hide_3d !== true
}
// Inspected 2026-10-22: current dark style uses openmaptiles / building.
// TileJSON declares render_height/render_min_height:Number, hide_3d:Boolean.
// Koramangala z14/11724/7598 has Polygon features with supplied heights 4,5,8m.
// Provider render heights can be generalized, not surveyed measurements.
export function buildingExtrusion(source: string, sourceLayer: string): FillExtrusionLayerSpecification {
  return {
    id: BUILDING_LAYER_ID, type: 'fill-extrusion', source, 'source-layer': sourceLayer, minzoom: 13,
    filter: ['all',
      ['==', ['geometry-type'], 'Polygon'],
      ['==', ['typeof', ['get', 'render_height']], 'number'],
      ['==', ['typeof', ['get', 'render_min_height']], 'number'],
      ['>', ['number', ['get', 'render_height'], 0], ['number', ['get', 'render_min_height'], 0]],
      ['>=', ['number', ['get', 'render_min_height'], -1], 0],
      ['!=', ['get', 'hide_3d'], true],
    ],
    paint: {
      'fill-extrusion-height': ['number', ['get', 'render_height'], 0],
      'fill-extrusion-base': ['number', ['get', 'render_min_height'], 0],
      'fill-extrusion-color': '#334b59', 'fill-extrusion-opacity': 0.86,
    },
  }
}
export function cameraDuration(reducedMotion: boolean) { return reducedMotion ? 0 : 1100 }
