# Local OSRM reproduction and exact verification

This workflow does not use historical hosted-service responses or overwrite production. It records the supplied generation provenance and provides a testable reconstruction. The original PBF is now included and its exact hash verified; the Docker image and live local server are not included or revalidated by documentation preparation. Exact regeneration has not been run here; only a matching input/image/profile and a passing exact verifier establish reproduction.

## 1. Acquire the input

Use https://extract.bbbike.org/ to request an OpenStreetMap PBF for longitude 77.475 to 77.742 and latitude 12.856 to 13.025. BBBike is the extraction service, not a new geographic license. Retain the download's terms/receipt and extract log. Underlying data is © OpenStreetMap contributors, ODbL 1.0.

The recorded input is planet_77.475,12.856_77.742,13.025.osm.pbf, dataset timestamp 2026-10-24T00:00:00Z, SHA-256 35f6a67ad1ab6f356edd55f61afcbdc07994f8363cf011872c1298d2a0e08cc0. A new extraction may use newer data and is not a substitute for the exact recorded bytes. The exact verified input is included at [public/source-data/planet_77.475,12.856_77.742,13.025.osm.pbf](../public/source-data/planet_77.475,12.856_77.742,13.025.osm.pbf) and served at /source-data/planet_77.475,12.856_77.742,13.025.osm.pbf. This removes the need to request a fresh, potentially different extract for this snapshot.

Create a private data directory outside this source tree, place the PBF there, and use PowerShell with Docker installed. Replace the path below with your own location; it is a variable, not a claimed download endpoint.

~~~powershell
$osrmData = (Resolve-Path '<your-external-data-directory>').Path
$includedPbf = Join-Path (Get-Location) 'public/source-data/planet_77.475,12.856_77.742,13.025.osm.pbf'
$workingPbf = Join-Path $osrmData 'planet_77.475,12.856_77.742,13.025.osm.pbf'
if (Test-Path -LiteralPath $workingPbf) { throw 'Choose an empty external working directory; refusing overwrite' }
Copy-Item -LiteralPath $includedPbf -Destination $workingPbf
$datasetName = 'planet_77.475,12.856_77.742,13.025.osm.pbf'
$expectedHash = '35f6a67ad1ab6f356edd55f61afcbdc07994f8363cf011872c1298d2a0e08cc0'
if ((Get-FileHash -LiteralPath (Join-Path $osrmData $datasetName) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash) { throw 'Wrong input: exact reproduction cannot be claimed' }
~~~

## 2. Pin image and preprocess

The recorded tag was ghcr.io/project-osrm/osrm-backend:latest. It is mutable. The recorded digest, not today's latest tag, is used below. Reported version: OSRM Backend v26.10.0; profile /opt/car.lua; algorithm MLD. Do not silently substitute another image if the digest is unavailable.

~~~powershell
$osrmImage = 'ghcr.io/project-osrm/osrm-backend@sha256:55dbfd47d984c2cacd64e32901b4321c86b5ec761438e69aa053dc78698a786f'
docker pull $osrmImage
if ($LASTEXITCODE -ne 0) { throw 'Pinned image unavailable' }
$versionOutput = docker run --rm $osrmImage osrm-extract --version
if ($LASTEXITCODE -ne 0 -or ($versionOutput -join ' ') -notmatch 'v?26\.10\.0') { throw 'Version mismatch' }
docker run --rm --mount "type=bind,source=$osrmData,target=/data" $osrmImage osrm-extract -p /opt/car.lua "/data/$datasetName"
if ($LASTEXITCODE -ne 0) { throw 'Extraction failed' }
$graphName = 'planet_77.475,12.856_77.742,13.025.osrm'
docker run --rm --mount "type=bind,source=$osrmData,target=/data" $osrmImage osrm-partition "/data/$graphName"
if ($LASTEXITCODE -ne 0) { throw 'Partition failed' }
docker run --rm --mount "type=bind,source=$osrmData,target=/data" $osrmImage osrm-customize "/data/$graphName"
if ($LASTEXITCODE -ne 0) { throw 'Customization failed' }
~~~

Retain the original dataset timestamp shown by the extraction log and the version/image/profile logs privately. These commands specify a reconstruction workflow; absent original full command logs, unspecified historical flags are not asserted known. The exact verifier below rejects a mismatch.

## 3. Serve and query locally

In a separate terminal, with the same variables defined, run:

~~~powershell
docker run --rm --mount "type=bind,source=$osrmData,target=/data" -p 127.0.0.1:5000:5000 $osrmImage osrm-routed --algorithm mld "/data/$graphName"
~~~

This binds a local server, not a public endpoint. Generate independent responses with these two requests. Save only to new files outside this source tree; do not replace included evidence automatically.

~~~powershell
$pickupUrl = 'http://127.0.0.1:5000/route/v1/driving/77.616,12.939;77.622,12.935?overview=full&geometries=geojson&steps=true&annotations=nodes,distance'
$deliveryUrl = 'http://127.0.0.1:5000/route/v1/driving/77.622,12.935;77.625,12.942?overview=full&geometries=geojson&steps=true&annotations=nodes,distance'
$pickupJson = Invoke-RestMethod -Uri $pickupUrl
$deliveryJson = Invoke-RestMethod -Uri $deliveryUrl
$pickupJson.code
$deliveryJson.code
~~~

Two requests reflect the supplied one-leg evidence format. Full original HTTP request logs were not supplied; defaults such as continue_straight are not retrospectively asserted. Any difference must be investigated, not erased by relaxing comparisons.

From the application source directory:

~~~powershell
npm.cmd run routes:verify-local
~~~

The verifier requests the two routes directly and requires complete coordinate arrays, order, distance and duration to match production exactly: pickup 35 points, 1022.6 m, 139.1 s; delivery 40 points, 1448.9 m, 175.8 s. It never writes production/evidence. A failure means this attempted reconstruction has not reproduced the snapshot.

## 4. Data access and legal limits

Recipients already receive complete machine-readable copies of the three distributed route datasets in public/route-data-source.json, also served at /route-data-source.json, with individual file paths and SHA-256 hashes. The original JSON files remain included. Regenerate this access package using npm.cmd run data:package; production build does this automatically.

The access package now links the original verified PBF as well as including every distributed route dataset. Pinned OSRM v26.10.0, /opt/car.lua and MLD commands above provide a method for generating the intermediate graph from those bytes; two separate requests and an exact verifier cover the route outputs. The PBF is offered voluntarily to make source access concrete, not because ODbL always requires it. A normal build includes direct downloads and uses a hard link to avoid duplicating the PBF physically within the release; source distribution has one canonical PBF file.

The OSRM graph is not distributed or queried by this demo at runtime; it was used internally to generate a fixed route cache. It may nevertheless be a Derivative Database from which a publicly used Produced Work was made. Section 4.5 internal-use language is not a blanket exemption from section 4.4(c)/4.6 in that situation. The exact source and pinned alteration method support the section 4.6(b) route, while the complete route datasets support access to the distributed collections. Original preprocessing logs/flags are not independently confirmed and exact graph/route regeneration has not been rerun here. Whether the provided method covers every relevant alteration is the remaining legal/factual qualification; no mandatory graph-distribution or universal graph exemption is claimed. See DATA_LICENSES.md for official references.

Car-profile estimates are not live traffic ETAs, motorcycle permissions or the demo clock. Existing 12/14/30-second behavior is separate.
