import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getEvents,
  getEvent,
  getVenueBySlug,
  getMatchesByVenue,
  getVenuesByEvent,
} from "@/lib/data";
import { venuePageMetadata, venueJsonLd, matchJsonLd } from "@/lib/seo";
import { AdUnit } from "@/components/AdUnit";

export async function generateStaticParams() {
  const events = getEvents();
  const params: { eventSlug: string; venueSlug: string }[] = [];
  for (const event of events) {
    if (event.venueIds.length === 0) continue;
    const venues = getVenuesByEvent(event.id);
    for (const venue of venues) {
      params.push({ eventSlug: event.id, venueSlug: venue.id });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventSlug: string; venueSlug: string }>;
}): Promise<Metadata> {
  const { eventSlug, venueSlug } = await params;
  const event = getEvent(eventSlug);
  if (!event) return {};
  const venue = getVenueBySlug(venueSlug);
  if (!venue) return {};
  const matches = getMatchesByVenue(eventSlug, venue.id);
  return venuePageMetadata(event, venue, matches);
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ eventSlug: string; venueSlug: string }>;
}) {
  const { eventSlug, venueSlug } = await params;
  const event = getEvent(eventSlug);
  if (!event) notFound();

  const venue = getVenueBySlug(venueSlug);
  if (!venue) notFound();

  const matches = getMatchesByVenue(eventSlug, venue.id);
  matches.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(venueJsonLd(venue, event)) }}
      />
      {matches.slice(0, 5).map((m) => (
        <script
          key={m.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(matchJsonLd(m, venue, event)) }}
        />
      ))}

      {/* Breadcrumb */}
      <nav className="text-sm text-zinc-400 mb-6">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        <span className="mx-1">/</span>
        <Link href={`/${eventSlug}/`} className="hover:text-emerald-600">{event.shortName}</Link>
        <span className="mx-1">/</span>
        <span className="text-zinc-700">{venue.name}</span>
      </nav>

      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden mb-8 h-56">
        <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-6">
          <h1 className="text-3xl font-bold text-white mb-1">{venue.name}</h1>
          <p className="text-white/80">{venue.city}</p>
        </div>
      </div>

      {/* Transit stations */}
      <h2 className="text-lg font-semibold text-zinc-800 mb-4">
        Transit Stations ({venue.transitStations.length})
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 mb-8">
        {venue.transitStations.map((station) => (
          <div
            key={station.name}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <h3 className="font-semibold text-zinc-800 text-sm">{station.name}</h3>
            <div className="mt-1 text-xs text-zinc-500">
              {station.lines.join(" · ")}
            </div>
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-emerald-600 font-medium">
                {station.transitMinutes} min transit
              </span>
              <span className="text-zinc-400">
                {station.walkMinutes} min walk
              </span>
            </div>
          </div>
        ))}
      </div>

      <AdUnit className="my-6" />

      {/* Matches */}
      <h2 className="text-lg font-semibold text-zinc-800 mb-4">
        Matches at {venue.name} ({matches.length})
      </h2>
      <div className="space-y-2 mb-8">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/${eventSlug}/search?matches=${match.id}&checkin=${match.date}&checkout=${match.date}`}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-emerald-400 transition-colors"
          >
            <div>
              <span className="font-semibold text-zinc-800">
                {match.teams[0]} vs {match.teams[1]}
              </span>
              <span className="text-zinc-400 ml-2 text-sm">{match.stage}</span>
            </div>
            <div className="text-right text-sm">
              <div className="text-zinc-600">{match.date} · {match.time}</div>
              <div className="text-emerald-600 font-medium">Find hotels →</div>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-emerald-800 mb-2">
          Find transit-connected hotels near {venue.name}
        </h3>
        <p className="text-emerald-600 text-sm mb-4">
          Hotels along {venue.transitStations.map((s) => s.lines[0]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(", ")} and more.
        </p>
        <Link
          href={`/${eventSlug}/`}
          className="inline-block bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          Browse all matches
        </Link>
      </div>
    </div>
  );
}
