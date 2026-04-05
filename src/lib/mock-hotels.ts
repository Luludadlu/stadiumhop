import type { Hotel } from "@/types";
import type { Venue } from "@/types";

// Hotel name templates by city character
const HOTEL_CHAINS = [
  "Holiday Inn",
  "Hampton Inn",
  "Comfort Inn",
  "Best Western",
  "La Quinta",
  "Fairfield Inn",
  "Courtyard by Marriott",
  "Hilton Garden Inn",
  "Hyatt Place",
  "SpringHill Suites",
  "Residence Inn",
  "Motel 6",
  "Red Roof Inn",
  "Candlewood Suites",
  "TownePlace Suites",
  "Home2 Suites",
  "Microtel Inn",
  "Tru by Hilton",
  "AC Hotel",
  "Aloft",
];

const BUDGET_NAMES = [
  "Motel 6",
  "Red Roof Inn",
  "Super 8",
  "Days Inn",
  "Econo Lodge",
];
const MID_NAMES = [
  "Holiday Inn Express",
  "Hampton Inn",
  "Comfort Suites",
  "Best Western Plus",
  "La Quinta Inn",
  "Fairfield Inn",
];
const UPSCALE_NAMES = [
  "Courtyard by Marriott",
  "Hilton Garden Inn",
  "Hyatt Place",
  "AC Hotel",
  "Aloft",
  "SpringHill Suites",
];

// Tier-based hotel images from Unsplash (free to use)
const BUDGET_IMAGES = [
  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80&fit=crop",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80&fit=crop",
  "https://images.unsplash.com/photo-1626862904461-a0831caec5b1?w=400&q=80&fit=crop",
  "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400&q=80&fit=crop",
];
const MID_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80&fit=crop",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80&fit=crop",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80&fit=crop",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80&fit=crop",
];
const UPSCALE_IMAGES = [
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80&fit=crop",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80&fit=crop",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80&fit=crop",
  "https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80&fit=crop",
];

// Seeded random for reproducible results
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickRandom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

/**
 * Generate mock hotels near a set of transit stations for a venue.
 * Each station gets 2-5 hotels within walking distance.
 */
export function generateMockHotels(
  venues: Venue[],
  options: {
    maxTransit?: number;
    minRating?: number;
    maxPrice?: number;
    seed?: number;
    checkin?: string;
    checkout?: string;
  } = {},
): Hotel[] {
  const { maxTransit = 90, minRating = 0, maxPrice = 999, seed = 42, checkin, checkout } = options;
  const rand = seededRandom(seed);
  const hotels: Hotel[] = [];
  let idCounter = 1;

  for (const venue of venues) {
    for (const station of venue.transitStations) {
      const stationTransitTime = station.transitMinutes + station.walkMinutes;

      // Skip stations beyond max transit
      if (stationTransitTime > maxTransit) continue;

      const hotelCount = 2 + Math.floor(rand() * 4); // 2-5 hotels per station

      for (let i = 0; i < hotelCount; i++) {
        // Walk time from hotel to station: 2-15 minutes
        const walkToStation = 2 + Math.floor(rand() * 14);
        const totalTransit = stationTransitTime + walkToStation;

        if (totalTransit > maxTransit) continue;

        // Price tiers based on proximity
        let price: number;
        let stars: number;
        let names: string[];
        let images: string[];

        const tier = rand();
        if (tier < 0.35) {
          // Budget
          price = 35 + Math.floor(rand() * 50); // $35-85
          stars = 2;
          names = BUDGET_NAMES;
          images = BUDGET_IMAGES;
        } else if (tier < 0.75) {
          // Mid-range
          price = 80 + Math.floor(rand() * 80); // $80-160
          stars = 3;
          names = MID_NAMES;
          images = MID_IMAGES;
        } else {
          // Upscale
          price = 140 + Math.floor(rand() * 120); // $140-260
          stars = 4;
          names = UPSCALE_NAMES;
          images = UPSCALE_IMAGES;
        }

        const rating = 2.5 + rand() * 2.5; // 2.5-5.0
        const roundedRating = Math.round(rating * 10) / 10;

        if (roundedRating < minRating) continue;
        if (price > maxPrice) continue;

        // Offset coords slightly from station
        const latOffset = (rand() - 0.5) * 0.012;
        const lngOffset = (rand() - 0.5) * 0.012;

        const hotelName = `${pickRandom(names, rand)} ${station.name.split(" ")[0]}`;

        const venueDistances = venues.map((v) => {
          // Find the best station from this hotel's location to each venue
          const bestStation = v.transitStations.reduce(
            (best, s) => {
              const dist = s.transitMinutes + s.walkMinutes;
              return dist < best.time ? { station: s, time: dist } : best;
            },
            { station: v.transitStations[0], time: Infinity },
          );

          return {
            venueId: v.id,
            venueName: v.name,
            totalMinutes:
              v.id === venue.id
                ? totalTransit
                : bestStation.time + walkToStation,
            route:
              v.id === venue.id
                ? `${station.lines[0]} → ${v.name}`
                : `${bestStation.station.lines[0]} → ${v.name}`,
          };
        });

        hotels.push({
          id: `h${String(idCounter++).padStart(3, "0")}`,
          name: hotelName,
          coords: {
            lat: station.coords.lat + latOffset,
            lng: station.coords.lng + lngOffset,
          },
          price,
          rating: roundedRating,
          stars,
          imageUrl: pickRandom(images, rand),
          bookingUrl: `https://www.skyscanner.net/hotels?q=${encodeURIComponent(hotelName + ", " + venue.city)}&checkin=${checkin || "2026-06-14"}&checkout=${checkout || "2026-06-16"}&adults=2&rooms=1`,
          nearestStation: {
            name: station.name,
            walkMinutes: walkToStation,
          },
          totalTransitMinutes: totalTransit,
          venueDistances:
            venues.length > 1 ? venueDistances : undefined,
        });
      }
    }
  }

  // Deduplicate by similar coordinates (within ~100m)
  const deduplicated: Hotel[] = [];
  for (const hotel of hotels) {
    const isDupe = deduplicated.some(
      (h) =>
        Math.abs(h.coords.lat - hotel.coords.lat) < 0.001 &&
        Math.abs(h.coords.lng - hotel.coords.lng) < 0.001,
    );
    if (!isDupe) deduplicated.push(hotel);
  }

  // Sort by total transit time
  deduplicated.sort((a, b) => a.totalTransitMinutes - b.totalTransitMinutes);

  return deduplicated;
}
