# Third-party software and asset notice inventory

## Reproducible source of notices

Run npm.cmd run notices after npm.cmd ci. scripts/collect-third-party-notices.mjs reads the installed versions corresponding to non-dev lockfile records and copies their original root LICENSE/LICENCE/COPYING/NOTICE file text unchanged into public/THIRD_PARTY_NOTICES.txt. For murmurhash-js 1.0.0, the installed README contains its MIT license; that README is retained verbatim. Its license section was confirmed against [upstream at the package gitHead](https://github.com/mikolalysenko/murmurhash-js/blob/72aabce3f52cb8f16245692a69fd35951e165af0/README.md).

The machine-readable docs/runtime-license-inventory.json records 28 runtime package versions, declared licenses, repositories and SHA-256 hashes of included legal files. Build regenerates this inventory and Vite copies the notice file into dist/THIRD_PARTY_NOTICES.txt. A published source snapshot should retain public/THIRD_PARTY_NOTICES.txt, the inventory, and this explanation; a distributed build must retain its notice file. The notice collector deliberately does not modify dependency files or assign a new license to them.

## Coverage and limits

Runtime roots: React and React DOM (MIT), MapLibre GL JS (BSD-3-Clause, including its inherited Mapbox and other notices). Transitive records include scheduler, Mapbox/MapLibre geometry and vector-tile utilities, bidi-js, earcut, gl-matrix, pbf, murmurhash-js and other helper packages. The JSON inventory enumerates each installed version. @maplibre/mlt offers MIT OR Apache-2.0; its original supplied texts are retained rather than relabeled. No third-party icon library is imported by the application.

Vite emits main-bundle-package-inventory.json and worker-bundle-package-inventory.json in dist, derived from observed chunk module IDs without local machine paths. Main modules expose React, React DOM, scheduler and MapLibre. The prebuilt MapLibre worker may hide its internal module boundaries; the full declared runtime graph and MapLibre supplied notices are therefore included conservatively. Neither observed IDs nor package metadata proves an exhaustive embedded-code audit. No claim is made that every listed package necessarily contributes executable code to the final bundle.

Dev tools retain their own licenses, not the intended original-code MIT license: TypeScript Apache-2.0, Vite/ESLint toolchain mostly MIT, Lightning CSS MPL-2.0, caniuse-lite data CC-BY-4.0 and other transitive declarations. Build-tool use alone does not relicense authored application code. Do not publish node_modules; if distributing covered tools or modified library files, satisfy their applicable notice/source requirements separately. The lockfile records optional platform packages not all installed on this system.

Remote map styles, glyphs, sprites and tiles are not included by this collector. OpenFreeMap's [license inventory](https://github.com/hyperknot/openfreemap/blob/main/LICENSE.md), supplied map attribution and [DATA_LICENSES.md](DATA_LICENSES.md) apply. No local font binaries or downloaded map tiles were found. New app artwork is documented in [ASSET_PROVENANCE.md](ASSET_PROVENANCE.md).

## Publication decision

Available installed runtime license texts are packaged with hashes; completeness beyond supplied legal files and prebundled internals is not legally certified. Preserve the notices and review upstream changes when updating dependencies. Manjunath Rao has confirmed the original-code MIT grant; it does not replace any third-party grant or notice.
