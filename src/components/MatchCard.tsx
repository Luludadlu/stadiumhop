import Link from "next/link";
import type { Match, Venue } from "@/types";
import { getCountryFlag } from "@/lib/flags";

interface MatchCardProps {
  match: Match;
  venue: Venue;
}

export function MatchCard({ match, venue }: MatchCardProps) {
  const date = new Date(match.date + "T00:00:00");
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const checkin = match.date;
  const checkout = new Date(date.getTime() + 86400000)
    .toISOString()
    .slice(0, 10);

  // Format time like "4:00 pm"
  const [h, m] = match.time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const timeStr = `${displayHour}:${m} ${ampm}`;

  const flag1 = getCountryFlag(match.teams[0]);
  const flag2 = getCountryFlag(match.teams[1]);

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md transition-all group">
      {/* Hero section with stadium background */}
      <div className="relative h-28 flex items-center justify-center px-5 overflow-hidden">
        <img
          src={venue.imageUrl}
          alt={venue.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40" />

        <div className="relative flex items-center justify-between w-full">
          <div className="flex flex-col items-center gap-1 flex-1">
            {flag1 && (
              <span className="text-2xl drop-shadow-lg">{flag1}</span>
            )}
            <span className="font-[var(--font-oswald)] text-sm sm:text-base font-bold text-white text-center leading-tight uppercase drop-shadow-lg">
              {match.teams[0]}
            </span>
          </div>

          <span className="font-[var(--font-oswald)] text-xs font-bold text-zinc-300 mx-2 shrink-0 drop-shadow-lg">
            vs
          </span>

          <div className="flex flex-col items-center gap-1 flex-1">
            {flag2 && (
              <span className="text-2xl drop-shadow-lg">{flag2}</span>
            )}
            <span className="font-[var(--font-oswald)] text-sm sm:text-base font-bold text-white text-center leading-tight uppercase drop-shadow-lg">
              {match.teams[1]}
            </span>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="px-5 py-4 space-y-2.5">
        <div className="flex items-center gap-2.5 text-sm text-zinc-600">
          <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <span>
            {dateFmt.format(date)} at {timeStr}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-zinc-600">
          <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <span>
            <strong className="text-zinc-900">{venue.name}</strong>, {venue.city}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-zinc-400">
          <svg className="w-4 h-4 text-zinc-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
          </svg>
          <span>
            {match.id.toUpperCase()}: {match.stage}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/${match.eventId}/search?matches=${match.id}&checkin=${checkin}&checkout=${checkout}`}
        className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-zinc-50 transition-colors"
      >
        <span>Find Hotels</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    </div>
  );
}
