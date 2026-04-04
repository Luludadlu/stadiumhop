import type { Event, Venue, Match } from "@/types";

import eventsData from "@/data/events.json";
import venuesData from "@/data/venues.json";
import fifaMatchesData from "@/data/fifa-2026/matches.json";

// ============================================================
// Events
// ============================================================

export function getEvents(): Event[] {
  return eventsData as Event[];
}

export function getEvent(slug: string): Event | undefined {
  return (eventsData as Event[]).find((e) => e.id === slug);
}

// ============================================================
// Venues
// ============================================================

export function getVenues(): Venue[] {
  return venuesData as Venue[];
}

export function getVenue(id: string): Venue | undefined {
  return (venuesData as Venue[]).find((v) => v.id === id);
}

export function getVenuesByEvent(eventId: string): Venue[] {
  const event = getEvent(eventId);
  if (!event) return [];
  const venueSet = new Set(event.venueIds);
  return (venuesData as Venue[]).filter((v) => venueSet.has(v.id));
}

// ============================================================
// Matches
// ============================================================

const matchesByEvent: Record<string, Match[]> = {
  "fifa-2026": fifaMatchesData as Match[],
};

export function getMatches(eventId: string): Match[] {
  return matchesByEvent[eventId] ?? [];
}

export function getMatch(matchId: string): Match | undefined {
  for (const matches of Object.values(matchesByEvent)) {
    const found = matches.find((m) => m.id === matchId);
    if (found) return found;
  }
  return undefined;
}

// ============================================================
// Derived helpers
// ============================================================

export function getCitiesByEvent(eventId: string): string[] {
  const venues = getVenuesByEvent(eventId);
  return [...new Set(venues.map((v) => v.city))].sort();
}

export function getTeamsByEvent(eventId: string): string[] {
  const matches = getMatches(eventId);
  const teams = new Set<string>();
  for (const m of matches) {
    for (const t of m.teams) {
      if (t !== "TBD") teams.add(t);
    }
  }
  return [...teams].sort();
}
