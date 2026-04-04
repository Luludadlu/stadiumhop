import Link from "next/link";
import type { Event } from "@/types";

export function EventCard({ event }: { event: Event }) {
  const startDate = new Date(event.startDate + "T00:00:00");
  const endDate = new Date(event.endDate + "T00:00:00");
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  const hasDetail = event.venueIds.length > 0;

  const card = (
    <div className="group block rounded-xl border border-zinc-200 bg-white hover:border-emerald-400 hover:shadow-lg transition-all overflow-hidden">
      {/* Hero image */}
      <div className="relative aspect-[2/1] overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            event.type === "sports"
              ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40"
              : event.type === "festival"
                ? "bg-purple-500/20 text-purple-200 ring-1 ring-purple-400/40"
                : "bg-pink-500/20 text-pink-200 ring-1 ring-pink-400/40"
          }`}>
            {event.type}
          </span>
        </div>

        {!hasDetail && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white ring-1 ring-white/30">
              Coming Soon
            </span>
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-3 left-4 right-4">
          <h2 className="text-lg font-bold text-white leading-tight drop-shadow-lg">
            {event.shortName}
          </h2>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-sm text-zinc-500 line-clamp-2">{event.description}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
          <span>
            {fmt.format(startDate)} – {fmt.format(endDate)},{" "}
            {endDate.getFullYear()}
          </span>
          {hasDetail && <span>{event.venueIds.length} venues</span>}
        </div>
      </div>
    </div>
  );

  if (hasDetail) {
    return <Link href={`/${event.id}/`}>{card}</Link>;
  }

  return <div className="opacity-75 cursor-default">{card}</div>;
}
