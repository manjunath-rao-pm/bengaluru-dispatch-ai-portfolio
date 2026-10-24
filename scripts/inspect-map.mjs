// Read-only inspection of the exact provider used by the app. No new map provider.
import { VectorTile } from '@mapbox/vector-tile'
import { PbfReader } from 'pbf'
const styleUrl = 'https://tiles.openfreemap.org/styles/dark'
const style = await (await fetch(styleUrl)).json()
const building = style.layers.find(layer => layer.type === 'fill' && layer['source-layer'] === 'building')
if (!building) throw new Error('No building layer in current style')
const metadata = await (await fetch(style.sources[building.source].url)).json()
const z = 14, n = 2 ** z, longitude = 77.622, latitude = 12.935
const x = Math.floor((longitude + 180) / 360 * n)
const y = Math.floor((1 - Math.asinh(Math.tan(latitude * Math.PI / 180)) / Math.PI) / 2 * n)
const tileUrl = metadata.tiles[0].replace('{z}', z).replace('{x}', x).replace('{y}', y)
const response = await fetch(tileUrl)
if (!response.ok) throw new Error(`Tile request failed: ${response.status}`)
const layer = new VectorTile(new PbfReader(new Uint8Array(await response.arrayBuffer()))).layers[building['source-layer']]
console.log(JSON.stringify({
  styleUrl, source: building.source, sourceLayer: building['source-layer'], originalBuildingLayer: building,
  schema: metadata.vector_layers.find(layer => layer.id === building['source-layer']),
  tileUrl, tile: [z, x, y], buildingCount: layer?.length ?? 0,
  samples: Array.from({ length: Math.min(5, layer?.length ?? 0) }, (_, index) => {
    const feature = layer.feature(index)
    return { geometryType: feature.type, properties: feature.properties, ringCount: feature.loadGeometry().length }
  }),
}, null, 2))
