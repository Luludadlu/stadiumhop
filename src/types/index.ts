// ============================================================
// Core types (generic, reusable across all events)
// ============================================================

export type EventType = "sports" | "concert" | "festival" | "tennis" | "other";

export interface Event {
  id: string; // URL slug, e.g., "fifa-2026"
  name: string; // "FIFA World Cup 2026"
  shortName: string; // "FIFA 2026"
  description: string;
  startDate: string; // "2026-06-11"
  endDate: string; // "2026-07-19"
  imageUrl: string;
  venueIds: string[];
  type: EventType;
}

export interface Venue {
  id: string; // e.g., "metlife"
  name: string; // "MetLife Stadium"
  city: string; // "New York/New Jersey"
  imageUrl: string; // stadium photo URL
  coords: { lat: number; lng: number };
  transitStations: TransitStation[];
}

export interface TransitStation {
  name: string; // "Secaucus Junction"
  coords: { lat: number; lng: number };
  lines: string[]; // ["NJ Transit Northeast Corridor"]
  transitMinutes: number; // time from this station to venue
  walkMinutes: number; // walk from station exit to venue entrance
}

// ============================================================
// FIFA-specific types
// ============================================================

export interface Match {
  id: string; // "m001"
  eventId: string; // "fifa-2026"
  date: string; // "2026-06-11"
  time: string; // "18:00"
  venueId: string;
  teams: [string, string]; // ["Mexico", "TBD"]
  stage: string; // "Group A"
  matchday: number;
}

// ============================================================
// Hotel search types (API response)
// ============================================================

export interface Hotel {
  id: string;
  name: string;
  coords: { lat: number; lng: number };
  price: number; // per night, USD
  rating: number; // 1-5
  stars: number;
  imageUrl: string;
  bookingUrl: string; // Skyscanner affiliate link
  nearestStation: {
    name: string;
    walkMinutes: number;
  };
  totalTransitMinutes: number;
  venueDistances?: VenueDistance[];
}

export interface VenueDistance {
  venueId: string;
  venueName: string;
  totalMinutes: number;
  route: string; // e.g., "NJ Transit → Meadowlands"
}
