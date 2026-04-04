import { notFound } from "next/navigation";
import { getEvent, getMatches, getVenuesByEvent } from "@/lib/data";
import { MatchFilters } from "@/components/MatchFilters";

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
