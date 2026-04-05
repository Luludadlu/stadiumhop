import type { Metadata } from "next";
import type { Event, Venue, Match } from "@/types";

const SITE_URL = "https://stadiumhop.com";
const SITE_NAME = "StadiumHop";

export function homeMetadata(): Metadata {
  return {
    title: "StadiumHop — Find hotels on the right transit line",
    description:
      "Find affordable hotels along public transit routes to major event venues. Save money by staying further away — on a direct train line.",
    openGraph: {
      title: "StadiumHop — Find hotels on the right transit line",
      description:
        "Find affordable hotels along transit routes to FIFA 2026, concerts, and festivals.",
      url: SITE_URL,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export function eventPageMetadata(event: Event): Metadata {
  const title = `${event.name} Hotels — Transit-Smart Search | ${SITE_NAME}`;
  const description = `Find affordable hotels along transit lines to ${event.name} venues. ${event.venueIds.length} venues across multiple cities.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${event.id}/`,
      siteName: SITE_NAME,
      type: "website",
      images: event.imageUrl ? [{ url: event.imageUrl }] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export function cityPageMetadata(
  event: Event,
  city: string,
  venues: Venue[],
): Metadata {
  const title = `${event.shortName} Hotels in ${city} | ${SITE_NAME}`;
  const description = `Find hotels near ${venues.map((v) => v.name).join(", ")} in ${city} for ${event.name}. Search by transit accessibility.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${event.id}/city/${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export function venuePageMetadata(
  event: Event,
  venue: Venue,
  matches: Match[],
): Metadata {
  const title = `Hotels near ${venue.name} | ${event.shortName} | ${SITE_NAME}`;
  const description = `Find transit-accessible hotels near ${venue.name} in ${venue.city} for ${event.name}. ${matches.length} matches, ${venue.transitStations.length} transit stations.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${event.id}/venue/${venue.id}`,
      siteName: SITE_NAME,
      type: "website",
      images: venue.imageUrl ? [{ url: venue.imageUrl }] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

// JSON-LD structured data
export function eventJsonLd(event: Event) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    description: event.description,
    image: event.imageUrl,
    url: `${SITE_URL}/${event.id}/`,
  };
}

export function venueJsonLd(venue: Venue, event: Event) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: venue.name,
    address: { "@type": "PostalAddress", addressLocality: venue.city },
    geo: {
      "@type": "GeoCoordinates",
      latitude: venue.coords.lat,
      longitude: venue.coords.lng,
    },
    event: {
      "@type": "Event",
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
    },
  };
}

export function matchJsonLd(match: Match, venue: Venue, event: Event) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${match.teams[0]} vs ${match.teams[1]}`,
    startDate: `${match.date}T${match.time}:00`,
    location: {
      "@type": "Place",
      name: venue.name,
      address: { "@type": "PostalAddress", addressLocality: venue.city },
    },
    superEvent: {
      "@type": "Event",
      name: event.name,
    },
  };
}
