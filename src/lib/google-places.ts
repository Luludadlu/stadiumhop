import type { Hotel, Venue } from "@/types";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  location?: { latitude: number; longitude: number };
  rating?: number;
  photos?: { name: string }[];
  formattedAddress?: string;
  priceLevel?: string;
}

/**
 * Search for real hotels near a venue's transit stations using Google Places API (New).
 * Returns Hotel[] compatible with the existing UI.
 */
export async function fetchRealHotels(
  venues: Venue[],
  options: {
    maxTransit?: number;
    checkin?: string;
    checkout?: string;
    maxResults?: number;
  } = {},
): Promise<Hotel[]> {
  const { maxTransit = 120, checkin, checkout, maxResults = 40 } = options;

  if (!API_KEY) {
    console.warn("No Google Places API key configured — returning empty hotels");
    return [];
  }

  // Collect search locations: venue itself + transit stations
  const rawPoints: { lat: number; lng: number; station: string; venue: Venue }[] = [];

  for (const venue of venues) {
    // Always search around the venue itself
    rawPoints.push({
      lat: venue.coords.lat,
      lng: venue.coords.lng,
      station: venue.name,
      venue,
    });

    // Also search around transit stations
    for (const station of venue.transitStations) {
      const totalStationTime = station.transitMinutes + station.walkMinutes;
      if (totalStationTime > maxTransit) continue;
      rawPoints.push({
        lat: station.coords.lat,
        lng: station.coords.lng,
        station: station.name,
        venue,
      });
    }
  }

  // Deduplicate search points that are within 1.5km of each other
  const searchPoints: typeof rawPoints = [];
  for (const pt of rawPoints) {
    const tooClose = searchPoints.some(
      (existing) => haversineKm(pt.lat, pt.lng, existing.lat, existing.lng) < 1.5,
    );
    if (!tooClose) searchPoints.push(pt);
  }

  // Limit to ~10 search points
  const limitedPoints = searchPoints.slice(0, 10);

  // Fetch hotels near each point in parallel
  // Use 5km radius for all points to maximize coverage
  const allResults = await Promise.all(
    limitedPoints.map((pt) => searchNearbyHotels(pt.lat, pt.lng, 5000)),
  );

  // Merge and deduplicate by place ID
  const seen = new Set<string>();
  const hotels: Hotel[] = [];

  for (let i = 0; i < allResults.length; i++) {
    const places = allResults[i];
    const pt = limitedPoints[i];

    for (const place of places) {
      if (!place.id || !place.location || seen.has(place.id)) continue;
      seen.add(place.id);

      const hotelLat = place.location.latitude;
      const hotelLng = place.location.longitude;

      // Find nearest station and calculate transit time
      const nearest = findNearestStation(hotelLat, hotelLng, venues);
      if (!nearest || nearest.totalMinutes > maxTransit) continue;

      // Map priceLevel to a star estimate
      const stars = priceLevelToStars(place.priceLevel);

      // Build photo URL
      const imageUrl = place.photos?.[0]
        ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=400&key=${API_KEY}`
        : getDefaultImage(stars);

      // Build Skyscanner affiliate link
      const hotelName = place.displayName?.text || "Hotel";
      const cityName = nearest.venue.city.split("/")[0].trim();
      const bookingUrl = `https://www.skyscanner.net/hotels?q=${encodeURIComponent(hotelName + ", " + cityName)}&checkin=${checkin || "2026-06-14"}&checkout=${checkout || "2026-06-16"}&adults=2&rooms=1`;

      hotels.push({
        id: place.id,
        name: place.displayName?.text || "Hotel",
        coords: { lat: hotelLat, lng: hotelLng },
        price: 0, // No price from Places API
        rating: place.rating || 0,
        stars,
        imageUrl,
        bookingUrl,
        nearestStation: {
          name: nearest.stationName,
          walkMinutes: nearest.walkMinutes,
        },
        totalTransitMinutes: nearest.totalMinutes,
        venueDistances:
          venues.length > 1
            ? venues.map((v) => {
                const best = findNearestStationForVenue(hotelLat, hotelLng, v);
                return {
                  venueId: v.id,
                  venueName: v.name,
                  totalMinutes: best?.totalMinutes || 999,
                  route: best ? `${best.line} → ${v.name}` : "N/A",
                };
              })
            : undefined,
      });

      if (hotels.length >= maxResults) break;
    }
    if (hotels.length >= maxResults) break;
  }

  // Sort by total transit time
  hotels.sort((a, b) => a.totalTransitMinutes - b.totalTransitMinutes);

  return hotels;
}

/** Google Places Nearby Search (New) */
async function searchNearbyHotels(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<PlaceResult[]> {
  const url = "https://places.googleapis.com/v1/places:searchNearby";

  const body = {
    includedTypes: ["lodging"],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.location,places.rating,places.photos,places.formattedAddress,places.priceLevel",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("Places API error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return (data.places || []) as PlaceResult[];
}

/** Calculate walking distance (rough estimate: Haversine → walk minutes) */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function walkMinutesFromKm(km: number): number {
  // Average walking speed ~5 km/h, add 20% for non-straight paths
  return Math.round((km * 1.2) / 5 * 60);
}

function findNearestStation(
  hotelLat: number,
  hotelLng: number,
  venues: Venue[],
): { stationName: string; walkMinutes: number; totalMinutes: number; venue: Venue; line: string } | null {
  let best: { stationName: string; walkMinutes: number; totalMinutes: number; venue: Venue; line: string } | null = null;

  for (const venue of venues) {
    const result = findNearestStationForVenue(hotelLat, hotelLng, venue);
    if (result && (!best || result.totalMinutes < best.totalMinutes)) {
      best = { ...result, venue };
    }
  }

  return best;
}

function findNearestStationForVenue(
  hotelLat: number,
  hotelLng: number,
  venue: Venue,
): { stationName: string; walkMinutes: number; totalMinutes: number; line: string } | null {
  let best: { stationName: string; walkMinutes: number; totalMinutes: number; line: string } | null = null;

  for (const station of venue.transitStations) {
    const distKm = haversineKm(hotelLat, hotelLng, station.coords.lat, station.coords.lng);
    const walk = walkMinutesFromKm(distKm);
    const total = walk + station.transitMinutes + station.walkMinutes;

    if (!best || total < best.totalMinutes) {
      best = {
        stationName: station.name,
        walkMinutes: walk,
        totalMinutes: total,
        line: station.lines[0] || "",
      };
    }
  }

  return best;
}

function priceLevelToStars(priceLevel?: string): number {
  switch (priceLevel) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return 2;
    case "PRICE_LEVEL_MODERATE":
      return 3;
    case "PRICE_LEVEL_EXPENSIVE":
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return 4;
    default:
      return 3;
  }
}

function getDefaultImage(stars: number): string {
  const images: Record<number, string> = {
    2: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80&fit=crop",
    3: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80&fit=crop",
    4: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80&fit=crop",
  };
  return images[stars] || images[3];
}
