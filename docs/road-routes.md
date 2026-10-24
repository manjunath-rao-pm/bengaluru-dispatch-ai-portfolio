# Local route provenance and regression protection

- Geographic source: OpenStreetMap contributors; extraction service: BBBike.
- Dataset: `planet_77.475,12.856_77.742,13.025.osm.pbf`; extraction-log dataset date: 2026-10-24T00:00:00Z.
- PBF SHA-256: `35f6a67ad1ab6f356edd55f61afcbdc07994f8363cf011872c1298d2a0e08cc0`.
- Software: OSRM Backend v26.10.0, reported verified with `osrm-extract --version`.
- Image: `ghcr.io/project-osrm/osrm-backend:latest`; recorded pull digest: `sha256:55dbfd47d984c2cacd64e32901b4321c86b5ec761438e69aa053dc78698a786f`. Pin the digest when reproducing.
- Extraction profile: `/opt/car.lua`; algorithm: MLD (extract, partition, customize, serve).
- Generation server: local `http://localhost:5000`, not a public routing service. Requests use `overview=full&geometries=geojson`; evidence also supplies steps and node/distance annotations.

These version, hash and extraction-log records are supplied generation provenance; preparation of this release does not independently authenticate the original PBF, image or logs. Exact request options and preprocessing logs should be retained for reproduction.

Production is `src/data/bengaluru-delivery-roads.json`: 35 pickup and 40 delivery coordinates. Independent responses `docs/local-routing/local-pickup-evidence.json` and `local-delivery-evidence.json` are test evidence, not application runtime dependencies. Each contains one route with one leg. Tests compare complete ordered geometries, distances, durations, snapped endpoints, maneuver continuity and reconstruction, node IDs and edge annotations. Existing edge tolerances are 1 m or 2%; total-length tolerance is 2%.

Waypoint IDs PARTNER-1, REST-1 and ORDER-1 identify synthetic demo locations. Their haversine snap adjustments are 35.118906 m, 14.450403 m and 5.231410 m. No waypoint road names are asserted. Road names inside local raw responses are routing-engine output, not verified addresses.

The app imports bundled geometry and makes no runtime routing requests. Pickup occurs at 12 simulated seconds, departure at 14, delivery at 30. Interpolation follows cumulative meters within consecutive road edges; pause/reset and milestone behavior use the same demo clock.

Car-profile durations are estimates, not live traffic ETAs or motorcycle navigation. The scooter is a visual demonstration. Extract and basemap snapshots can differ. Road centerlines do not establish current traffic, closures, lanes or entrance access. No on-site survey or browser visual QA is asserted.

The snapshot includes the checksum-verified original PBF for source access; it contains no preprocessing binaries, historical hosted-service response, legacy generator or Git history. This does not determine the disposition of artifacts in any other repository. See [data notice](DATA_LICENSES.md) for unresolved distribution requirements.

## Recipient data access and reconstruction

The [complete distributed route data package](../public/route-data-source.json) includes all three original route datasets and hashes. A build serves it at `/route-data-source.json` through a visible map download link. See [the reproduction guide](LOCAL_OSRM_REPRODUCTION.md) for pinned Docker preprocessing, source acquisition and read-only exact-match verification. The original PBF is offered and pinned graph-regeneration instructions are included; remaining method-completeness qualifications are recorded in [DATA_LICENSES.md](DATA_LICENSES.md). Original code/artwork uses MIT, copyright 2026 Manjunath Rao; the route data does not become MIT.
