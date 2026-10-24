# Code, geographic data and third-party licensing

## Original application license

Copyright (c) 2026 Manjunath Rao. The owner confirms this is an independent personal portfolio project and chooses MIT for original application source code and original artwork owned by Manjunath Rao. [LICENSE](../LICENSE) contains the standard MIT terms from the [Open Source Initiative](https://opensource.org/license/mit). This is not a statement that every file is MIT. Dependencies, remote assets and OSM-derived geography retain their respective terms. [Asset provenance](ASSET_PROVENANCE.md) and [third-party notices](THIRD_PARTY_NOTICES.md) remain part of this package.

## Geographic source and attribution

Road and map data: © OpenStreetMap contributors. [OSM copyright](https://www.openstreetmap.org/copyright); [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/); [OSMF Attribution Guidelines](https://osmfoundation.org/wiki/Attribution_Guidelines). Extract service: [BBBike](https://extract.bbbike.org/). OSRM is routing software, not the owner of OSM geography. Synthetic partners, restaurants, customer identities, KPIs and events do not describe real personal operations.

- Geographic source: OpenStreetMap contributors; extraction service: BBBike.
- Dataset: `planet_77.475,12.856_77.742,13.025.osm.pbf`; extraction-log dataset date: 2026-10-24T00:00:00Z.
- PBF SHA-256: `35f6a67ad1ab6f356edd55f61afcbdc07994f8363cf011872c1298d2a0e08cc0`.
- Software: OSRM Backend v26.10.0, reported verified with `osrm-extract --version`.
- Image: `ghcr.io/project-osrm/osrm-backend:latest`; recorded pull digest: `sha256:55dbfd47d984c2cacd64e32901b4321c86b5ec761438e69aa053dc78698a786f`. Pin the digest when reproducing.
- Extraction profile: `/opt/car.lua`; algorithm: MLD (extract, partition, customize, serve).
- Generation server: local `http://localhost:5000`, not a public routing service. Requests use `overview=full&geometries=geojson`; evidence also supplies steps and node/distance annotations.


## Exact distributed geographic datasets

The following are offered as ODbL-covered geographic datasets, conservatively treating their structured OSM-derived parts as database extracts/arrangements rather than claiming a small-extraction exemption:

| File | Material and classification | Applicable publication treatment |
| --- | --- | --- |
| [src/data/bengaluru-delivery-roads.json](../src/data/bengaluru-delivery-roads.json) | Ordered GeoJSON route/waypoint collection: pickup 35 vertices, delivery 40. Structured OSM-derived extract with local metrics and synthetic waypoint originals; not merely a rendered image. | Preserve OSM attribution, ODbL URI and provenance; geographic collection offered on ODbL terms. Determine derivative-database scope for share-alike/source access. |
| [local-pickup-evidence.json](local-routing/local-pickup-evidence.json) | Independent one-leg OSRM JSON with geometry, maneuvers, graph annotations and snapped waypoints. Structured geographic evidence, not application MIT code. | Same data notice/ODbL offer in this adjacent document and source-access package; preserve this notice with raw downloads. |
| [local-delivery-evidence.json](local-routing/local-delivery-evidence.json) | Independent delivery-leg OSRM JSON with the same kinds of structured geographic content. | Same attribution, notice, share-alike and applicable source-access treatment as pickup evidence. |
| [public/route-data-source.json](../public/route-data-source.json) | Access container holding complete parsed copies of all three datasets plus original-file hashes, attribution and ODbL URI. | ODbL geographic data package; not a new independently owned geographic source or an MIT relicensing. |

The original [BBBike PBF](../public/source-data/planet_77.475,12.856_77.742,13.025.osm.pbf) is also included, offered as an OSM-derived database extract under ODbL 1.0 with adjacent [source notice](../public/source-data/README.md). Its verified size is 31,679,641 bytes and SHA-256 is 35f6a67ad1ab6f356edd55f61afcbdc07994f8363cf011872c1298d2a0e08cc0. No processed routing graph is distributed. docs/phase-a-map-data.md records provider observations rather than distributing a tile dataset. Runtime map display is a Produced Work presentation; remote basemap source databases and style assets have separate provider terms. The OSMF routing safe harbour addresses routing instructions, but does not decide that a structured geographic collection can never be a Derivative Database. Exact substantiality/derivative scope depends on the actual processing and material; no blanket exemption is asserted.

## ODbL obligations and recipient access

Sections 4.2 through 4.4 require preservation of applicable notices/license references, attribution for public output and share-alike where a Derivative Database is publicly used. Section 4.5 limits share-alike, including distinct collective components and internal use; it does not turn OSM geography into MIT code. Section 4.6 requires access to the relevant entire Derivative Database or qualifying complete alteration/method material, machine-readable and free online for online distribution. A rendered route and structured source can have different classifications.

Recipients can open the three linked original files directly from this source package. For the running app/build, the visible "Route data (ODbL)" map link downloads /route-data-source.json without authentication or a fee. The same package lives at public/route-data-source.json for offline source recipients. Each entry contains its original path, SHA-256 of original bytes and complete parsed data. Build regenerates it with npm.cmd run data:package. Original raw files retain exact bytes and are not silently rewritten. This provides actual access to every route dataset distributed here, rather than only a promise or hash. No online deployment is created by preparing the package.

This is a concrete data-access mechanism for the included collections, not certification that the wider processed routing graph is outside section 4.6. The verified original PBF is now offered at the linked source location and /source-data/planet_77.475,12.856_77.742,13.025.osm.pbf; the processed graph is not distributed and a complete original alteration/command log remains unavailable. [The reproduction guide](LOCAL_OSRM_REPRODUCTION.md) supplies pinned preprocessing and verification commands; it must not be claimed a sufficient alteration offer if further material is required. The original PBF need not automatically be bundled in every case: first identify the relevant derivative scope and whether the full supplied datasets or an appropriate method/source offer covers it. Resolve that remaining scope/access question before public release; do not advertise full ODbL compliance merely because the download exists.

Keep attribution visible with the map, preserve license/source notices in redistributed data, include this notice with the raw evidence, and do not impose additional restrictions incompatible with ODbL. Nothing here relicenses third-party code or grants independent rights to every OSRM response field. Manjunath Rao's MIT grant is scoped to original application code/artwork, separate from the geographic data offer.

## Basemap hosting and OpenMapTiles

- **OpenFreeMap** hosts the basemap and style used by the app:
  https://tiles.openfreemap.org/styles/dark
- Provider information, required credits and licensing information:
  https://openfreemap.org/ and https://github.com/hyperknot/openfreemap/blob/main/LICENSE.md
- Provider terms: https://openfreemap.org/tos/
- **OpenMapTiles** schema/cartographic attribution: https://openmaptiles.org/
- OpenMapTiles license information (code BSD-3-Clause, design CC BY 4.0):
  https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md

Map credits include OpenStreetMap, OpenMapTiles and OpenFreeMap. OpenFreeMap's
own guidance says its provider-name credit is optional; it is retained here.
The provider's MIT project license does not replace OSM's geographic-data license
or the licenses of its included styles/schema. Additional supplied source credits
remain in MapLibre's native attribution control, rather than being replaced.
MapLibre is the rendering library, not the origin of the road data.



## Third-party software and generated artwork

Runtime notice text, package versions and legal-file hashes remain in public/THIRD_PARTY_NOTICES.txt, docs/runtime-license-inventory.json and docs/THIRD_PARTY_NOTICES.md. Build copies the notice text unchanged. No application MIT license supersedes those grants. Remote fonts, glyphs, sprites, styles and tiles remain governed by their providers; no local font binaries or tile packages are bundled. New geometric artwork is documented in docs/ASSET_PROVENANCE.md; no authorship is claimed over removed material.

## Source-service facts and limits

[BBBike published terms](https://extract.bbbike.org/extract.html#terms-of-service) identify OSM data as ODbL, with fair use/no warranty for the extraction service and professional plans for commercial service use. They do not establish a blanket prohibition on OSM redistribution. The recorded extraction's original terms/receipt and archived bytes are not supplied; clarify service-use questions if applicable. OpenFreeMap hosting terms do not replace OSM/OpenMapTiles licensing. OSRM Backend software is BSD-2-Clause, MapLibre BSD-3-Clause, OpenMapTiles code BSD-3-Clause/design CC-BY-4.0; none independently licenses OSM geography.

Car-profile estimates are not live traffic ETAs or motorcycle navigation. Simulation pickup/departure/delivery remain 12/14/30 seconds. No on-site survey or fresh browser-rendering verification is asserted. Historical hosted-service artifacts and private Git history are not included; no conclusion about other repositories follows.

## Release decision

| Item | Status |
| --- | --- |
| Original-code/artwork owner and MIT | Resolved by explicit owner confirmation; root LICENSE issued. |
| Third-party notices and artwork provenance | Preserved with documented scope; original-code MIT does not replace them. |
| Geographic artifact inventory, attribution and direct access | Implemented for every included route dataset, with free build download. |
| Exact regeneration | Exact input is supplied and verified; full historical flags/logs remain unconfirmed. Pinned guide and exact verifier provided; reconstruction not rerun here. |
| ODbL source access | Complete route datasets, verified original PBF and pinned regeneration method supplied. Remaining qualification: complete-method sufficiency for any relevant derivative graph; no automatic graph/PBF mandate asserted. |

Publication is reasonably supported on a documented source-plus-method basis, subject to the specific method-completeness qualification below. This is not definitive legal clearance. No repository, publication, push or deployment is performed.

## Final source-access assessment

The original PBF, complete route JSON collections, hashes and pinned generation method are available to recipients free of charge in the source distribution and built downloads. Preserve these source links with any distributed demo. The JSON data link identifies the PBF directly. The geography remains ODbL-covered; original application MIT licensing is separate.

Under [ODbL section 4.6](https://opendatacommons.org/licenses/odbl/1-0/), offering the relevant full derivative or a qualifying complete alteration method are alternatives. We supply all distributed geographic outputs, the unchanged verified input, and an executable reconstruction method. This makes publication reasonably supportable without assuming the PBF alone automatically meets every obligation. [OSMF attribution guidance](https://osmfoundation.org/wiki/Attribution_Guidelines) supports the retained OSM/ODbL map credits and linked origin/license notices, but is not a ruling that a particular OSRM graph is legally exempt.

The intermediate graph is an internal preprocessing artifact and not a separately distributed dataset in this app. That factual distinction does not necessarily remove section 4.6 where publicly used output derives from it. The source-plus-method approach is intended to address that possibility without distributing the graph itself. Exact historical preprocessing flags and full alteration equivalence remain unverified: if the graph involved undisclosed modifications or the published method is incomplete, that material or a qualifying graph copy must additionally be supplied. No such extra modifications have been established here. This is the precise unresolved qualification, rather than an assumed legal requirement to publish every intermediate binary.
