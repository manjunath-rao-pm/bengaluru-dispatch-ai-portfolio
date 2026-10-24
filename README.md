# Bengaluru Dispatch AI

An interactive React + TypeScript + Vite + MapLibre portfolio demonstration of a road-following delivery in Bengaluru. Real OpenStreetMap geography supports synthetic logistics locations, events and KPIs. It demonstrates geographic rendering, deterministic simulation, distance-based animation and regression-tested UI behavior; it does not implement an AI dispatch optimizer or live operations.

## Interactive features

Explore 35 demo markers, switch city/focused delivery views and 2D/3D buildings, start/pause/resume/reset a scooter delivery, follow its heading, and inspect route stages and milestone effects. Manual map navigation releases follow mode. Reduced-motion preferences are supported. Pickup is at 12 demo seconds, departure at 14 and delivery at 30.

## Local setup and checks

Use Node.js 24 and npm. From this directory:

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

Open Vite's printed URL. Basemap tiles/fonts/sprites require internet; routing geometry is bundled and Start/Reset make no routing requests. No routing API key is required. Production build artifacts and installed dependencies are generated locally and are not release source files.

## Road data and reproducibility

Production contains 35 pickup and 40 delivery vertices, backed by two independent local OSRM response files used by offline tests. Waypoint road names are omitted. The snapshot excludes historical hosted-service responses, preprocessing binaries and Git history; it includes one verified source PBF for ODbL source access. A read-only local OSRM verifier and documented reproduction workflow are included; no automatic production overwrite is provided.

- Geographic source: OpenStreetMap contributors; extraction service: BBBike.
- Dataset: `planet_77.475,12.856_77.742,13.025.osm.pbf`; extraction-log dataset date: 2026-10-24T00:00:00Z.
- PBF SHA-256: `35f6a67ad1ab6f356edd55f61afcbdc07994f8363cf011872c1298d2a0e08cc0`.
- Software: OSRM Backend v26.10.0, reported verified with `osrm-extract --version`.
- Image: `ghcr.io/project-osrm/osrm-backend:latest`; recorded pull digest: `sha256:55dbfd47d984c2cacd64e32901b4321c86b5ec761438e69aa053dc78698a786f`. Pin the digest when reproducing.
- Extraction profile: `/opt/car.lua`; algorithm: MLD (extract, partition, customize, serve).
- Generation server: local `http://localhost:5000`, not a public routing service. Requests use `overview=full&geometries=geojson`; evidence also supplies steps and node/distance annotations.

Car-profile durations are estimates, not live traffic ETAs or motorcycle navigation. The scooter is a visual demonstration. Extract and basemap snapshots can differ. Road centerlines do not establish current traffic, closures, lanes or entrance access. No on-site survey or browser visual QA is asserted.

[Route provenance and tests](docs/road-routes.md) describe the evidence. [Data attribution and unresolved distribution requirements](docs/DATA_LICENSES.md) must be reviewed before publication. OpenStreetMap geographic data uses ODbL 1.0; BBBike provides extraction; OSRM handles local routing. MapLibre renders OpenFreeMap/OpenMapTiles basemap content with retained attribution. Synthetic operations are separate from real geography. Original application code and original artwork owned by Manjunath Rao use MIT; this does not establish legal clearance for third-party material.

## Architecture

- `src/simulation/roadGeometry.ts`: validates the cache, calculates cumulative
  metre distances, binary-searches the containing road edge, interpolates within
  that edge, slices the original polyline and calculates local tangent bearings.
  Missing/invalid road data throws explicitly; there is no invented fallback.
- `src/simulation/deliverySimulation.ts`: pure state transitions using elapsed
  simulation milliseconds. The 12/14/30-second lifecycle is separate from geometry.
- `src/simulation/deliveryPresentation.ts`: upcoming/completed road GeoJSON and
  target vehicle heading. Route splits exactly match the engine's position.
- `src/hooks/useDeliverySimulation.ts`: one requestAnimationFrame chain using
  monotonic deltas. Paused and hidden-tab time is excluded; cleanup is StrictMode-safe.
- `src/map/deliveryVisuals.ts`: updates existing map resources and uses simulation
  delta to damp heading and follow-camera movement. No second RAF or simulation clock.
  Pickup effects follow simulation time; delivery completion uses one finite native
  decorative fade, cancelled by Reset/unmount.
- `src/map/scooterSymbol.ts`: authored SVG on the original selected partner marker.
  MapLibre handles map-aligned rotation and pitch; other partner icons stay static.
- `src/components/DispatchMap.tsx`: persistent MapLibre map, existing 35 markers,
  camera modes and controls, route attribution and verified building data.
- `src/map/buildings.ts`: real provider footprint extrusions using supplied heights;
  missing, invalid or zero-height geometry is skipped. See
  [Phase A building inspection](docs/phase-a-map-data.md).

The map-first desktop HUD, responsive mobile stacking, marker popups, compact
fixed demo KPIs, activity feed, camera controls, reduced-motion support and
single-delivery scope remain intact. No AI or multi-partner simulation.


## Release assets and notices

See [asset provenance](docs/ASSET_PROVENANCE.md) and [third-party notices](docs/THIRD_PARTY_NOTICES.md). The production build regenerates runtime notices and includes them with bundle inventories. New geometric icons, vehicle artwork and favicon need browser QA. The owner has confirmed copyright 2026 Manjunath Rao and MIT for original application code and original artwork. ODbL scope/source-access decisions remain recorded in the data notice. Passing technical checks is not publication clearance. Keep node_modules and dist out of any new repository.

## Licensing

Original application code and original artwork owned by Manjunath Rao: **MIT**, Copyright (c) 2026 Manjunath Rao; see [LICENSE](LICENSE). This grant does not supersede third-party licenses or apply MIT to all repository files. OSM-derived geographic datasets are offered on applicable **ODbL 1.0** terms; see [DATA_LICENSES.md](docs/DATA_LICENSES.md). Dependencies and remote maps/fonts/assets retain separate licenses and attributions; see [THIRD_PARTY_NOTICES.md](docs/THIRD_PARTY_NOTICES.md).

All three route datasets are accessible as ordinary source files and in [the machine-readable source package](public/route-data-source.json). Builds expose it at `/route-data-source.json` with a visible map download link. See [local OSRM reproduction](docs/LOCAL_OSRM_REPRODUCTION.md) for acquisition, pinned preprocessing, requests and exact verification. The package covers the distributed route data; the verified original PBF is directly linked from that package. Pinned regeneration instructions document remaining exact-method limitations without claiming legal clearance.

The original [source PBF](public/source-data/planet_77.475,12.856_77.742,13.025.osm.pbf) (31,679,641 bytes) is directly downloadable, checksum-verified and governed by ODbL geography terms, not the application MIT license. Its adjacent notice and the reproduction guide accompany it. The generated build uses the same payload through a hard link; commit only the single canonical file under public/source-data, not dist or preprocessing outputs.
