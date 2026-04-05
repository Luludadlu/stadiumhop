import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getEvents,
  getEvent,
  getCityBySlug,
  getVenuesByCity,
  getMatchesByVenue,
  getCitiesByEvent,
} from "@/lib/data";
import { slugify } from "@/lib/slugify";
import { cityPageMetadata, eventJsonLd, venueJsonLd } from "@/lib/seo";
import { AdUnit } from "@/components/AdUnit";

export async function generateStaticParams() {
  const events = getEvents();
  const params: { eventSlug: string; citySlug: string }[] = [];
  for (const event of events) {
    if (event.venueIds.length === 0) continue;
    const cities = getCitiesByEvent(event.id);
    for (const city of cities) {
      params.push({ eventSlug: event.id, citySlug: slugify(city) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventSlug: string; citySlug: string }>;
}): Promise<Metadata> {
  const { eventSlug, citySlug } = await params;
  const event = getEvent(eventSlug);
  if (!event) return {};
  const city = getCityBySlug(eventSlug, citySlug);
  if (!city) return {};
  const venues = getVenuesByCity(eventSlug, city);
  return cityPageMetadata(event, city, venues);
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ eventSlug: string; citySlug: string }>;
}) {
  const { eventSlug, citySlug } = await params;
  const event = getEvent(eventSlug);
  if (!event) notFound();

  const city = getCityBySlug(eventSlug, citySlug);
  if (!city) notFound();

  const venues = getVenuesByCity(eventSlug, city);
  const allMatches = venues.flatMap((v) => getMatchesByVenue(eventSlug, v.id));
  allMatches.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventJsonLd(event)),
        }}
      />
      {venues.map((v) => (
        <script
          key={v.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(venueJsonLd(v, event)),
          }}
        />
      ))}

      {/* Breadcrumb */}
      <nav className="text-sm text-zinc-400 mb-6">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        <span className="mx-1">/</span>
        <Link href={`/${eventSlug}/`} className="hover:text-emerald-600">{event.shortName}</Link>
        <span className="mx-1">/</span>
        <span className="text-zinc-700">{city}</span>
      </nav>

      {/* Header */}
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">
        {event.shortName} Hotels in {city}
      </h1>
      <p className="text-zinc-500 mb-8">
        Find transit-accessible hotels near {venues.length} venue{venues.length > 1 ? "s" : ""} in {city} for {event.name}.
      </p>

      {/* Venues */}
      <h2 className="text-lg font-semibold text-zinc-800 mb-4">Venues in {city}</h2>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        {venues.map((venue) => {
          const venueMatches = getMatchesByVenue(eventSlug, venue.id);
          return (
            <Link
              key={venue.id}
              href={`/${eventSlug}/venue/${venue.id}`}
              className="block rounded-xl border border-zinc-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all overflow-hidden"
            >
              <div className="relative h-32 overflow-hidden">
                <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <h3 className="absolute bottom-3 left-4 text-white font-bold text-lg">{venue.name}</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-zinc-500">
                  {venueMatches.length} matches · {venue.transitStations.length} transit stations
                </p>
                <p className="text-sm text-emerald-600 font-medium mt-2">
                  View venue details →
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <AdUnit className="my-6" />

      {/* Upcoming matches */}
      <h2 className="text-lg font-semibold text-zinc-800 mb-4">Matches in {city}</h2>
      <div className="space-y-2 mb-8">
        {allMatches.slice(0, 20).map((match) => {
          const venue = venues.find((v) => v.id === match.venueId);
          return (
            <Link
              key={match.id}
              href={`/${eventSlug}/search?matches=${match.id}&checkin=${match.date}&checkout=${match.date}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-emerald-400 transition-colors"
            >
              <div>
                <span className="font-semibold text-zinc-800">
                  {match.teams[0]} vs {match.teams[1]}
                </span>
                <span className="text-zinc-400 ml-2 text-sm">
                  {match.stage}
                </span>
              </div>
              <div className="text-right text-sm">
                <div className="text-zinc-600">{match.date} · {match.time}</div>
                {venue && <div className="text-zinc-400">{venue.name}</div>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-emerald-800 mb-2">
          Find the best transit-connected hotels in {city}
        </h3>
        <p className="text-emerald-600 text-sm mb-4">
          Select a match above to search for hotels along direct transit lines to the venue.
        </p>
        <Link
          href={`/${eventSlug}/`}
          className="inline-block bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          Browse all {event.shortName} matches
        </Link>
      </div>
    </div>
  );
}
