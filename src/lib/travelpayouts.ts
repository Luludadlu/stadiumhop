import type { Hotel } from "@/types";
import type { Venue } from "@/types";

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN || "";
const MARKER = TOKEN; // Travelpayouts uses token as marker for affiliate links

interface HotellookHotel {
  hotelId: number;
  hotelName: string;
  stars: number;
  priceFrom: number;
  priceAvg?: number;
  pricePercentile?: Record<string, number>;
  locationId: number;
  location: { lat: number; lon: number };
  address?: string;
  link?: string;
}

/**
 * Search hotels near a coordinate using Hotellook (Travelpayouts) API.
 * Uses the map/tiles endpoint for geo-based search.
 */
async function searchHotelsNearCoord(
  lat: number,
  lng: number,
  checkin: string,
  checkout: string,
  radiusKm: number = 2,
): Promise<HotellookHotel[]> {
  // Use the Hotellook API — search by geo coordinates
  const url = new URL("https://yasen.hotellook.com/tp/public/widget_location_dump.json");
  url.searchParams.set("currency", "usd");
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "30");
  url.searchParams.set("token", TOKEN);
  url.searchParams.set("coordinates", `${lat},${lng}`);
  url.searchParams.set("radius", String(radiusKm * 1000)); // meters

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // The response is an array of hotels or an object with hotels
    if (Array.isArray(data)) return data;
    if (data?.hotels) return data.hotels;
    return [];
  } catch {
    return [];
  }
}

/**
 * Build affiliate booking URL for a hotel.
 */
function buildBookingUrl(
  hotelId: number,
  hotelName: string,
  checkin: string,
  checkout: string,
): string {
  const params = new URLSearchParams({
    marker: MARKER,
    hotelId: String(hotelId),
    checkIn: checkin,
    checkOut: checkout,
    language: "en",
    currency: "usd",
  });
  return `https://search.hotellook.com/hotels?${params.toString()}`;
}

/**
 * Search hotels near all transit stations for given venues.
 * Returns Hotel[] in our app's format.
 */
export async function searchHotelsForVenues(
  venues: Venue[],
  checkin: string,
  checkout: string,
  options: { maxTransit?: number; minRating?: number; maxPrice?: number } = {},
): Promise<Hotel[]> {
  const { maxTransit = 90, minRating = 0, maxPrice = 999 } = options;
  const allHotels: Hotel[] = [];
  const seen = new Set<number>(); // dedupe by hotelId

  for (const venue of venues) {
    for (const station of venue.transitStations) {
      const stationTransitTime = station.transitMinutes + station.walkMinutes;
      if (stationTransitTime > maxTransit) continue;

      const results = await searchHotelsNearCoord(
        station.coords.lat,
        station.coords.lng,
        checkin,
        checkout,
        1.5, // 1.5km radius around station
      );

      for (const h of results) {
        if (seen.has(h.hotelId)) continue;
        seen.add(h.hotelId);

        const price = h.priceFrom || h.priceAvg || 0;
        if (price <= 0 || price > maxPrice) continue;

        const stars = h.stars || 0;
        const rating = stars > 0 ? Math.min(stars + 0.5, 5) : 3; // approximate
        if (rating < minRating) continue;

        // Estimate walk time from hotel to station (~5 min/400m)
        const distKm = Math.hypot(
          (h.location.lat - station.coords.lat) * 111,
          (h.location.lon - station.coords.lng) * 111 * Math.cos(station.coords.lat * Math.PI / 180),
        );
        const walkMinutes = Math.round(distKm / 0.08); // ~5 min per 400m
        const totalTransit = stationTransitTime + walkMinutes;

        if (totalTransit > maxTransit) continue;

        allHotels.push({
          id: `tp-${h.hotelId}`,
          name: h.hotelName,
          coords: { lat: h.location.lat, lng: h.location.lon },
          price: Math.round(price),
          rating: Math.round(rating * 10) / 10,
          stars,
          imageUrl: `https://photo.hotellook.com/image_v2/crop/h${h.hotelId}_1/320/240.auto`,
          bookingUrl: buildBookingUrl(h.hotelId, h.hotelName, checkin, checkout),
          nearestStation: {
            name: station.name,
            walkMinutes,
          },
          totalTransitMinutes: totalTransit,
          venueDistances:
            venues.length > 1
              ? venues.map((v) => {
                  const best = v.transitStations.reduce(
                    (b, s) => {
                      const t = s.transitMinutes + s.walkMinutes;
                      return t < b.time ? { station: s, time: t } : b;
                    },
                    { station: v.transitStations[0], time: Infinity },
                  );
                  return {
                    venueId: v.id,
                    venueName: v.name,
                    totalMinutes:
                      v.id === venue.id ? totalTransit : best.time + walkMinutes,
                    route: `${station.lines[0]} → ${v.name}`,
                  };
                })
              : undefined,
        });
      }
    }
  }

  // Sort by transit time
  allHotels.sort((a, b) => a.totalTransitMinutes - b.totalTransitMinutes);
  return allHotels;
}
