import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEvent, getMatches, getVenuesByEvent } from "@/lib/data";
import { MatchFilters } from "@/components/MatchFilters";
import { eventPageMetadata, eventJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}): Promise<Metadata> {
  const { eventSlug } = await params;
  const event = getEvent(eventSlug);
  if (!event) return {};
  return eventPageMetadata(event);
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = getEvent(eventSlug);
  if (!event) notFound();

  const matches = getMatches(event.id);
  const venues = getVenuesByEvent(event.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(event)) }}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{event.name}</h1>
        <p className="text-zinc-500 mt-1">
          {event.description} · {venues.length} venues ·{" "}
          {matches.length} matches
        </p>
      </div>

      <MatchFilters matches={matches} venues={venues} />
    </div>
  );
}
