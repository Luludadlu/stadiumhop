import type { MetadataRoute } from "next";
import { getEvents, getVenuesByEvent, getCitiesByEvent } from "@/lib/data";
import { slugify } from "@/lib/slugify";

const SITE_URL = "https://stadiumhop.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];

  const events = getEvents();
  for (const event of events) {
    if (event.venueIds.length === 0) continue;

    // Event page
    entries.push({
      url: `${SITE_URL}/${event.id}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    });

    // City pages
    const cities = getCitiesByEvent(event.id);
    for (const city of cities) {
      entries.push({
        url: `${SITE_URL}/${event.id}/city/${slugify(city)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // Venue pages
    const venues = getVenuesByEvent(event.id);
    for (const venue of venues) {
      entries.push({
        url: `${SITE_URL}/${event.id}/venue/${venue.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
