# Release visual asset provenance

Updated 2026-10-24. This record describes this release copy only and makes no authorship claim over removed material.

| Material | Action and origin |
| --- | --- |
| src/assets/hero.png | Removed: unused image without documented origin. No replacement is loaded because the dashboard uses the live map and CSS panels. |
| src/assets/react.svg and vite.svg | Removed: unused brand artwork with unestablished asset notices. |
| public/icons.svg | Removed: unused social-brand sprite; no social brands are needed by this app. |
| public/favicon.svg | Replaced with a newly composed dark tile, two colored rectangular stops and an orthogonal connector. index.html now loads it. |
| src/App.tsx Icon component | Replaced prior path artwork with newly composed rect/circle/line/polyline arrangements, maintaining nine semantic roles and currentColor styling. No third-party icon package is imported. |
| src/map/scooterSymbol.ts | Replaced previous artwork with a newly composed abstract delivery vehicle using rectangles, circle and ellipse. Existing marker positioning and heading behavior is retained. |
| CSS dashboard, markers and effects | Source-authored CSS and text; no downloaded textures, image backgrounds or icon fonts found. Existing contribution ownership remains an owner decision. |
| Basemap glyphs, sprites and map design | Remote OpenFreeMap/OpenMapTiles/OSM content, not original app artwork. Native provider attribution retained. See DATA_LICENSES.md. |
| MapLibre navigation controls | Third-party library UI under the installed MapLibre license and inherited notices; see THIRD_PARTY_NOTICES.md. |

New artwork was composed during this implementation from geometric primitives without tracing removed assets. This is provenance of the implementation, not a fabricated copyright-holder identity or MIT grant. The owner has confirmed this independent personal project and MIT licensing for original code/artwork owned by Manjunath Rao, copyright 2026. Third-party material remains separately licensed.

No font binaries or third-party icon packages are bundled in the source tree. The CSS font stack names Inter and system fonts without downloading Inter. Map labels obtain glyphs through the remote map style; those are separate provider assets. Browser QA should inspect icon legibility, the new favicon and moving marker in 2D/3D at different zooms, plus attribution visibility. No browser QA was performed here.
