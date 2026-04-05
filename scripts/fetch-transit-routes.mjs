/**
 * Fetch detailed transit route data for all venues using Google Routes API.
 * Usage: node scripts/fetch-transit-routes.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = "AIzaSyAqmIRVKuPNBwNtzwiQdaiAQkCaeaUUbOY";

const venuesPath = resolve(__dirname, "../src/data/venues.json");
const venues = JSON.parse(readFileSync(venuesPath, "utf-8"));

// ─── Polyline decoder ───────────────────────────────────────
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// ─── Fetch via Routes API ────────────────────────────────────
async function fetchTransitRoute(originLat, originLng, destLat, destLng) {
  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "routes.legs.steps.transitDetails,routes.legs.steps.travelMode,routes.legs.steps.polyline",
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
      destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
      travelMode: "TRANSIT",
      departureTime: "2026-06-11T16:00:00Z",
      computeAlternativeRoutes: true,
    }),
  });
  return res.json();
}

const round = (n) => Math.round(n * 10000) / 10000;

// ─── Default colors by vehicle type ─────────────────────────
const TYPE_COLORS = {
  SUBWAY: "#0077C0",
  HEAVY_RAIL: "#E86C00",
  COMMUTER_TRAIN: "#00A94F",
  TRAM: "#9B59B6",
  LIGHT_RAIL: "#C03",
  BUS: "#6B7280",
  FERRY: "#00A4E4",
};

// ─── Process one venue ──────────────────────────────────────
async function processVenue(venue) {
  console.log(`\n━━━ ${venue.name} (${venue.city}) ━━━`);

  // lineKey -> { color, stops: Map<name, {lat,lng}>, polylinePoints: {lat,lng}[] }
  const lineMap = new Map();

  for (const station of venue.transitStations) {
    console.log(`  ${station.name} → ${venue.name}...`);
    try {
      const data = await fetchTransitRoute(
        station.coords.lat, station.coords.lng,
        venue.coords.lat, venue.coords.lng,
      );

      if (!data.routes?.length) {
        console.log(`    ⚠ No routes`);
        addFallback(lineMap, station, venue);
        continue;
      }

      for (const route of data.routes) {
        for (const leg of route.legs) {
          for (const step of leg.steps) {
            if (step.travelMode !== "TRANSIT" || !step.transitDetails) continue;
            const td = step.transitDetails;
            const lineName = td.transitLine?.name || td.transitLine?.nameShort || "Unknown";
            const lineColor = td.transitLine?.color || TYPE_COLORS[td.transitLine?.vehicle?.type] || "#0077C0";

            if (!lineMap.has(lineName)) {
              lineMap.set(lineName, { color: lineColor, stops: new Map(), polyPoints: [] });
            }
            const entry = lineMap.get(lineName);

            // Add named stops
            const dep = td.stopDetails?.departureStop;
            const arr = td.stopDetails?.arrivalStop;
            if (dep?.name) entry.stops.set(dep.name, { lat: dep.location.latLng.latitude, lng: dep.location.latLng.longitude });
            if (arr?.name) entry.stops.set(arr.name, { lat: arr.location.latLng.latitude, lng: arr.location.latLng.longitude });

            // Intermediate stops from stopCount
            if (td.stopCount) {
              console.log(`    ✓ ${lineName} (${lineColor}) — ${td.stopCount} stops`);
            }

            // Decode polyline for path accuracy
            if (step.polyline?.encodedPolyline) {
              const pts = decodePolyline(step.polyline.encodedPolyline);
              entry.polyPoints.push(...pts);
            }
          }
        }
      }
    } catch (err) {
      console.log(`    ✗ ${err.message}`);
      addFallback(lineMap, station, venue);
    }
    await new Promise(r => setTimeout(r, 250));
  }

  // Add venue terminus to all lines
  for (const entry of lineMap.values()) {
    entry.stops.set(venue.name, { lat: venue.coords.lat, lng: venue.coords.lng });
  }

  // Convert to TransitLine[]
  const lines = [];
  for (const [name, entry] of lineMap) {
    // Build station list: named stops sorted furthest-first from venue
    const stations = [...entry.stops.entries()]
      .map(([n, c]) => ({
        name: n, lat: round(c.lat), lng: round(c.lng),
        dist: Math.hypot(c.lat - venue.coords.lat, c.lng - venue.coords.lng),
      }))
      .sort((a, b) => b.dist - a.dist)
      .map(({ name: n, lat, lng }) => ({ name: n, lat, lng }));

    if (stations.length < 2) continue;

    // If we have polyline points, sample some intermediate waypoints
    if (entry.polyPoints.length > 4) {
      const sampled = sampleWaypoints(entry.polyPoints, stations, 6);
      // Insert waypoints between named stations
      const merged = mergeStationsAndWaypoints(stations, sampled);
      lines.push({ name, color: entry.color, stations: merged });
    } else {
      lines.push({ name, color: entry.color, stations });
    }

    console.log(`  📍 ${name}: ${lines[lines.length - 1].stations.length} pts`);
  }

  return lines;
}

function addFallback(lineMap, station, venue) {
  for (const lineName of station.lines) {
    if (!lineMap.has(lineName)) lineMap.set(lineName, { color: "#0077C0", stops: new Map(), polyPoints: [] });
    const entry = lineMap.get(lineName);
    entry.stops.set(station.name, { lat: station.coords.lat, lng: station.coords.lng });
  }
}

// Sample N waypoints from polyline, avoiding points too close to named stations
function sampleWaypoints(polyPoints, namedStations, maxWaypoints) {
  if (polyPoints.length <= 2) return [];
  const step = Math.max(1, Math.floor(polyPoints.length / (maxWaypoints + 1)));
  const waypoints = [];
  for (let i = step; i < polyPoints.length - 1; i += step) {
    const p = polyPoints[i];
    // Skip if too close to a named station
    const tooClose = namedStations.some(s =>
      Math.abs(s.lat - p.lat) < 0.002 && Math.abs(s.lng - p.lng) < 0.002
    );
    if (!tooClose) {
      waypoints.push({ name: `~wp`, lat: round(p.lat), lng: round(p.lng) });
    }
    if (waypoints.length >= maxWaypoints) break;
  }
  return waypoints;
}

// Merge named stations with waypoints in geographic order
function mergeStationsAndWaypoints(stations, waypoints) {
  if (waypoints.length === 0) return stations;
  const all = [...stations, ...waypoints];
  // Sort by distance from first station (furthest) to last (venue)
  const first = stations[0];
  const last = stations[stations.length - 1];
  const lineVec = { lat: last.lat - first.lat, lng: last.lng - first.lng };
  const lineLen = Math.hypot(lineVec.lat, lineVec.lng) || 1;

  all.sort((a, b) => {
    const projA = ((a.lat - first.lat) * lineVec.lat + (a.lng - first.lng) * lineVec.lng) / lineLen;
    const projB = ((b.lat - first.lat) * lineVec.lat + (b.lng - first.lng) * lineVec.lng) / lineLen;
    return projA - projB;
  });
  return all;
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log("🚇 Fetching transit routes via Google Routes API...\n");

  const routesByVenue = {};
  let calls = 0;

  for (const venue of venues) {
    const lines = await processVenue(venue);
    if (lines.length > 0) routesByVenue[venue.id] = lines;
    calls += venue.transitStations.length;
  }

  console.log(`\n✅ Done! ${calls} API calls. ${Object.keys(routesByVenue).length} venues.\n`);

  // Generate TypeScript
  let ts = `/**
 * Detailed transit line routes with stations and waypoints.
 * Auto-generated by scripts/fetch-transit-routes.mjs via Google Routes API.
 * Generated: ${new Date().toISOString().slice(0, 10)}
 */

export interface RouteStation {
  name: string;
  lat: number;
  lng: number;
}

export interface TransitLine {
  name: string;
  color: string;
  /** Stations in geographic order (first = furthest from venue) */
  stations: RouteStation[];
}

export const transitRoutesByVenue: Record<string, TransitLine[]> = {\n`;

  for (const [venueId, lines] of Object.entries(routesByVenue)) {
    const venue = venues.find(v => v.id === venueId);
    ts += `  // ─── ${venue?.name || venueId} ─────────────────────────────────\n`;
    ts += `  "${venueId}": [\n`;
    for (const line of lines) {
      ts += `    {\n      name: ${JSON.stringify(line.name)},\n      color: ${JSON.stringify(line.color)},\n      stations: [\n`;
      for (const s of line.stations) {
        ts += `        { name: ${JSON.stringify(s.name)}, lat: ${s.lat}, lng: ${s.lng} },\n`;
      }
      ts += `      ],\n    },\n`;
    }
    ts += `  ],\n\n`;
  }
  ts += `};\n`;

  const outPath = resolve(__dirname, "../src/data/transit-routes.ts");
  writeFileSync(outPath, ts);
  console.log(`📝 Written to ${outPath}`);
}

main().catch(console.error);
