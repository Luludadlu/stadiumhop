import { notFound } from "next/navigation";
import Link from "next/link";
import { getEvent, getMatch, getVenue } from "@/lib/data";
import { searchHotelsForVenues } from "@/lib/travelpayouts";
import { generateMockHotels } from "@/lib/mock-hotels";
import { SearchResults } from "@/components/SearchResults";
import type { Venue } from "@/types";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { eventSlug } = await params;
  const sp = await searchParams;

  const event = getEvent(eventSlug);
  if (!event) notFound();

  const matchIds =
    typeof sp.matches === "string" ? sp.matches.split(",") : [];
  const checkin = typeof sp.checkin === "string" ? sp.checkin : "";
  const checkout = typeof sp.checkout === "string" ? sp.checkout : "";

  const selectedMatches = matchIds
    .map((id) => getMatch(id))
    .filter((m) => m !== undefined);

  // No matches selected — show fallback
  if (selectedMatches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/${eventSlug}/`}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            &larr; Back to {event.shortName}
          </Link>
        </div>
        <p className="text-zinc-500">
          No matches selected.{" "}
          <Link
            href={`/${eventSlug}/`}
            className="text-emerald-400 hover:text-emerald-300"
          >
            Go back and select matches.
          </Link>
        </p>
      </div>
    );
  }

  // Collect unique venues from selected matches
  const venueMap = new Map<string, Venue>();
  for (const match of selectedMatches) {
    const venue = getVenue(match.venueId);
    if (venue && !venueMap.has(venue.id)) {
      venueMap.set(venue.id, venue);
    }
  }
  const venues = [...venueMap.values()];

  // Try real hotel data, fallback to mock
  let hotels;
  try {
    hotels = await searchHotelsForVenues(venues, checkin, checkout);
  } catch {
    hotels = generateMockHotels(venues, { seed: 42 });
  }
  if (hotels.length === 0) {
    hotels = generateMockHotels(venues, { seed: 42 });
  }

  return (
    <SearchResults
      hotels={hotels}
      matches={selectedMatches}
      venues={venues}
      checkin={checkin}
      checkout={checkout}
      eventSlug={eventSlug}
      eventName={event.shortName}
    />
  );
}
