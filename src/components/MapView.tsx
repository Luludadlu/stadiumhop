"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import type { Hotel, Venue } from "@/types";
import {
  transitRoutesByVenue,
  type TransitLine,
  type RouteStation,
} from "@/data/transit-routes";

// ─── Fallback line colors (consistent per line name) ────────
const FALLBACK_COLORS = [
  "#0077C0", // blue
  "#E86C00", // orange
  "#00A94F", // green
  "#C03", // red
  "#9B59B6", // purple
  "#00A4E4", // light blue
  "#E91E63", // pink
  "#795548", // brown
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * When transit-routes.ts has no detailed data for a venue,
 * build TransitLine[] from venue.transitStations by grouping
 * stations that share a line name and connecting them to the venue.
 */
function buildFallbackLines(venue: Venue): TransitLine[] {
  const lineMap = new Map<string, RouteStation[]>();

  for (const station of venue.transitStations) {
    for (const lineName of station.lines) {
      if (!lineMap.has(lineName)) lineMap.set(lineName, []);
      lineMap.get(lineName)!.push({
        name: station.name,
        lat: station.coords.lat,
        lng: station.coords.lng,
      });
    }
  }

  // Add venue itself as the terminus of every line
  const venuePt: RouteStation = {
    name: venue.name,
    lat: venue.coords.lat,
    lng: venue.coords.lng,
  };

  const lines: TransitLine[] = [];
  let colorIdx = 0;
  for (const [name, stations] of lineMap) {
    // Sort by distance to venue (furthest first)
    stations.sort((a, b) => {
      const da = Math.hypot(a.lat - venue.coords.lat, a.lng - venue.coords.lng);
      const db = Math.hypot(b.lat - venue.coords.lat, b.lng - venue.coords.lng);
      return db - da;
    });
    // Append venue terminus if not already there
    const last = stations[stations.length - 1];
    if (last.name !== venue.name) stations.push(venuePt);

    lines.push({
      name,
      color: FALLBACK_COLORS[hashString(name) % FALLBACK_COLORS.length],
      stations,
    });
    colorIdx++;
  }
  return lines;
}

// ─── Props ───────────────────────────────────────────────────
interface MapViewProps {
  hotels: Hotel[];
  venues: Venue[];
  hoveredHotel: string | null;
  selectedHotel: string | null;
  onHotelSelect: (id: string | null) => void;
  /** When a station is clicked, parent can filter hotels by station name */
  onStationSelect?: (stationName: string | null) => void;
}

// ─── Hotel marker on map ─────────────────────────────────────
// Shows as a small dot by default, price pill when station is selected or hotel is hovered/selected
function HotelMarkerDot({
  hotel,
  isHovered,
  isSelected,
  showPrice,
  onClick,
}: {
  hotel: Hotel;
  isHovered: boolean;
  isSelected: boolean;
  showPrice: boolean;
  onClick: () => void;
}) {
  const highlight = isHovered || isSelected;

  // Show price pill when station is selected or hotel is highlighted
  if (showPrice || highlight) {
    return (
      <div
        onClick={onClick}
        style={{
          background: highlight ? "#0891b2" : "#059669",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          padding: "4px 10px",
          borderRadius: 12,
          whiteSpace: "nowrap",
          boxShadow: highlight
            ? "0 4px 12px rgba(8,145,178,0.5)"
            : "0 2px 6px rgba(0,0,0,0.25)",
          border: highlight
            ? "2px solid #fff"
            : "2px solid rgba(255,255,255,0.6)",
          cursor: "pointer",
          transform: highlight ? "scale(1.15)" : "scale(1)",
          transition: "all 0.15s ease",
        }}
      >
        {hotel.price > 0 ? `$${hotel.price}` : hotel.rating > 0 ? `★${hotel.rating}` : "Hotel"}
      </div>
    );
  }

  // Default: small dot
  return (
    <div
      onClick={onClick}
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#059669",
        border: "1.5px solid #fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    />
  );
}

// ─── Venue marker ────────────────────────────────────────────
function VenueMarker({ venue }: { venue: Venue }) {
  return (
    <div
      style={{
        background: "#dc2626",
        color: "#fff",
        fontSize: 13,
        fontWeight: 800,
        padding: "6px 14px",
        borderRadius: 8,
        whiteSpace: "nowrap",
        textAlign: "center",
        boxShadow:
          "0 0 16px rgba(220,38,38,0.4), 0 4px 8px rgba(0,0,0,0.2)",
        border: "2px solid #fff",
      }}
    >
      ⚽ {venue.name}
    </div>
  );
}

// ─── Station marker: dot only, name on hover/click ──────────
function StationMarker({
  station,
  colors,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  station: RouteStation;
  colors: string[];
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const unique = [...new Set(colors)];
  const showLabel = isSelected || isHovered;
  const primaryColor = unique[0] || "#0077C0";
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
      }}
    >
      {/* Dot */}
      <div
        style={{
          width: showLabel ? 16 : 14,
          height: showLabel ? 16 : 14,
          borderRadius: "50%",
          background: unique.length === 1 ? primaryColor : `conic-gradient(${unique.map((c, i) => `${c} ${(i / unique.length) * 360}deg ${((i + 1) / unique.length) * 360}deg`).join(", ")})`,
          border: "2px solid #fff",
          boxShadow: showLabel
            ? "0 0 8px rgba(0,0,0,0.3)"
            : "0 1px 3px rgba(0,0,0,0.3)",
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
      />
      {/* Name label — only on hover/click */}
      {showLabel && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: isSelected ? "#fff" : "#1f2937",
            whiteSpace: "nowrap",
            background: isSelected
              ? "rgba(8,145,178,0.9)"
              : "rgba(255,255,255,0.95)",
            padding: "2px 8px",
            borderRadius: 4,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            lineHeight: 1.3,
          }}
        >
          {station.name}
        </span>
      )}
    </div>
  );
}

// ─── Line name label on the polyline ─────────────────────────
function LineLabel({ line }: { line: TransitLine }) {
  return (
    <div
      style={{
        background: line.color,
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 10,
        whiteSpace: "nowrap",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      {line.name}
    </div>
  );
}

// ─── Inner map content ───────────────────────────────────────
function MapInner({
  hotels,
  venues,
  hoveredHotel,
  selectedHotel,
  onHotelSelect,
  onStationSelect,
}: MapViewProps) {
  const map = useMap();

  // Get transit lines — use detailed routes or fallback from venue data
  const transitLines = useMemo(() => {
    return venues.flatMap((v) => {
      const detailed = transitRoutesByVenue[v.id];
      if (detailed && detailed.length > 0) return detailed;
      return buildFallbackLines(v);
    });
  }, [venues]);

  // All coordinates for bounds fitting
  const bounds = useMemo(() => {
    const allCoords = [
      ...hotels.map((h) => h.coords),
      ...venues.map((v) => v.coords),
      ...transitLines.flatMap((l) =>
        l.stations.map((s) => ({ lat: s.lat, lng: s.lng })),
      ),
    ];
    if (allCoords.length === 0) return null;

    return {
      south: Math.min(...allCoords.map((c) => c.lat)),
      west: Math.min(...allCoords.map((c) => c.lng)),
      north: Math.max(...allCoords.map((c) => c.lat)),
      east: Math.max(...allCoords.map((c) => c.lng)),
    };
  }, [hotels, venues, transitLines]);

  useEffect(() => {
    if (map && bounds) {
      map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
    }
  }, [map, bounds]);

  // Pan to selected hotel
  useEffect(() => {
    if (map && selectedHotel) {
      const hotel = hotels.find((h) => h.id === selectedHotel);
      if (hotel) {
        map.panTo({ lat: hotel.coords.lat, lng: hotel.coords.lng });
      }
    }
  }, [map, selectedHotel, hotels]);

  // Draw transit polylines
  useEffect(() => {
    if (!map) return;
    const polylines: google.maps.Polyline[] = [];

    transitLines.forEach((line) => {
      const path = line.stations.map((s) => ({ lat: s.lat, lng: s.lng }));
      // White outline for contrast
      const outline = new google.maps.Polyline({
        path,
        strokeColor: "#ffffff",
        strokeWeight: 7,
        strokeOpacity: 0.8,
        geodesic: true,
        map,
        zIndex: 1,
      });
      // Colored line on top
      const colored = new google.maps.Polyline({
        path,
        strokeColor: line.color,
        strokeWeight: 5,
        strokeOpacity: 0.9,
        geodesic: true,
        map,
        zIndex: 2,
      });
      polylines.push(outline, colored);
    });

    return () => {
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, transitLines]);

  // Collect all line colors per station (for multi-color rectangles)
  const uniqueStations = useMemo(() => {
    const seen = new Map<string, { station: RouteStation; colors: string[] }>();
    transitLines.forEach((line) => {
      line.stations.forEach((s) => {
        // Skip venue-name entries (they have their own marker)
        if (venues.some((v) => v.name === s.name)) return;
        const existing = seen.get(s.name);
        if (existing) {
          existing.colors.push(line.color);
        } else {
          seen.set(s.name, { station: s, colors: [line.color] });
        }
      });
    });
    return [...seen.values()] as { station: RouteStation; colors: string[] }[];
  }, [transitLines, venues]);

  // Track selected + hovered station
  const [selectedStation, setSelectedStation] = React.useState<string | null>(null);
  const [hoveredStation, setHoveredStation] = React.useState<string | null>(null);

  const handleStationClick = useCallback(
    (stationName: string) => {
      const next = selectedStation === stationName ? null : stationName;
      setSelectedStation(next);
      onStationSelect?.(next);
    },
    [selectedStation, onStationSelect],
  );

  return (
    <>
      {/* Line name labels */}
      {transitLines.map((line) => {
        const mid = line.stations[Math.floor(line.stations.length / 2)];
        return (
          <AdvancedMarker
            key={`label-${line.name}`}
            position={{ lat: mid.lat + 0.003, lng: mid.lng }}
            zIndex={300}
          >
            <LineLabel line={line} />
          </AdvancedMarker>
        );
      })}

      {/* Station markers — dots, name on hover/click */}
      {uniqueStations.map(({ station, colors }) => (
        <AdvancedMarker
          key={`station-${station.name}`}
          position={{ lat: station.lat, lng: station.lng }}
          zIndex={selectedStation === station.name || hoveredStation === station.name ? 500 : 400}
        >
          <StationMarker
            station={station}
            colors={colors}
            isSelected={selectedStation === station.name}
            isHovered={hoveredStation === station.name}
            onClick={() => handleStationClick(station.name)}
            onMouseEnter={() => setHoveredStation(station.name)}
            onMouseLeave={() => setHoveredStation(null)}
          />
        </AdvancedMarker>
      ))}

      {/* Venue markers */}
      {venues.map((v) => (
        <AdvancedMarker
          key={v.id}
          position={{ lat: v.coords.lat, lng: v.coords.lng }}
          zIndex={1000}
        >
          <VenueMarker venue={v} />
        </AdvancedMarker>
      ))}

      {/* Hotel markers — dots by default, price pills when station selected */}
      {hotels.map((h) => {
        const showPrice = !!selectedStation && h.nearestStation.name === selectedStation;
        return (
          <AdvancedMarker
            key={h.id}
            position={{ lat: h.coords.lat, lng: h.coords.lng }}
            zIndex={hoveredHotel === h.id || selectedHotel === h.id ? 999 : showPrice ? 300 : 200}
          >
            <HotelMarkerDot
              hotel={h}
              isHovered={hoveredHotel === h.id}
              isSelected={selectedHotel === h.id}
              showPrice={showPrice}
              onClick={() => onHotelSelect(h.id)}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

// ─── Map legend ─────────────────────────────────────────────
function MapLegend({ venues }: { venues: Venue[] }) {
  const lines = useMemo(() => {
    const seen = new Map<string, string>();
    for (const v of venues) {
      const detailed = transitRoutesByVenue[v.id];
      const transitLines = detailed && detailed.length > 0 ? detailed : buildFallbackLines(v);
      for (const line of transitLines) {
        if (!seen.has(line.name)) seen.set(line.name, line.color);
      }
    }
    return [...seen.entries()];
  }, [venues]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        background: "rgba(255,255,255,0.95)",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 12,
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        maxWidth: 220,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 11, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Transit Lines
      </div>
      {lines.map(([name, color]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 20, height: 4, borderRadius: 2, background: color, flexShrink: 0 }} />
          <span style={{ color: "#374151", lineHeight: 1.3 }}>{name}</span>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />
        <span style={{ color: "#374151" }}>Venue</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#059669", flexShrink: 0 }} />
        <span style={{ color: "#374151" }}>Hotel (price)</span>
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────
export function MapView(props: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900 text-zinc-500 text-sm">
        Google Maps API key not configured
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <APIProvider apiKey={apiKey}>
        <GoogleMap
          defaultCenter={{ lat: 40.78, lng: -74.07 }}
          defaultZoom={11}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId="stadiumhop-map"
          style={{ width: "100%", height: "100%" }}
        >
          <MapInner {...props} />
        </GoogleMap>
      </APIProvider>
      <MapLegend venues={props.venues} />
    </div>
  );
}
