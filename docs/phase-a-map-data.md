# Phase A: map data inspection and limitations

Inspected the actual current provider responses on 2026-10-22 using
`scripts/inspect-map.mjs`. No new provider, API key, routing API, or 3D library.

- Style: https://tiles.openfreemap.org/styles/dark
- Existing vector source ID: `openmaptiles`
- TileJSON: https://tiles.openfreemap.org/planet
- Existing fill layer ID: `building`; source layer: `building`
- TileJSON fields: `render_height: Number`, `render_min_height: Number`,
  `hide_3d: Boolean`, `colour: String`
- TileJSON building zoom range: 13–14; overzoom works at closer views.
- Actual Koramangala tile: z14 / x11724 / y7598
- Tile inspected: https://tiles.openfreemap.org/planet/20261018_080001_pt/14/11724/7598.pbf
- 17 building features (some aggregate many polygon rings).
- Sample feature geometry type: vector-tile type 3 (Polygon).
- Sample supplied height/base pairs: 0/0, 4/0, 5/0, 5/0, 8/0 metres.

`src/map/buildings.ts` uses only the verified height/base fields. It discovers the
source ID from the loaded style. At runtime, the map also inspects loaded source
features: a valid Polygon/MultiPolygon with numeric positive height above a
nonnegative base must exist before adding the layer. Missing fields, string
heights, zero-height geometry, inverted bases, and `hide_3d` features are skipped.
The layer passes MapLibre's own style validator. No positive default heights
are assigned. The original footprint and label layers are retained.

The fill-extrusion layer is inserted below labels and is visible in pitched mode
at zoom 13 and above. In 2D it is hidden. Style reloads reinstall the layer once
valid data is loaded. All added event listeners are removed during cleanup.
No camera motion or map initialization runs as part of simulation frame updates.

Important limits: provider render heights can be generalized or derived by the
provider; they are not guaranteed surveyed building heights. Many buildings are
low-rise, and coverage/detail varies. There is no photorealistic mesh, terrain,
satellite imagery, or invented skyline. The status line reports unavailable
building data or suggests zooming in if eligible geometry is not loaded.
The 3D camera still works when buildings are unavailable.

Camera controls use smooth, finite transitions; reduced-motion preference makes
them immediate. Reset view restores the initial camera at Koramangala in the
currently selected 2D/3D mode and clears camera padding. It does not reset the
delivery. The delivery Reset control restores simulation state independently.

Documentation used for implementation:
https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/

No Phase B or C features were added.
