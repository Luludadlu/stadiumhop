import type { Hotel } from "@/types";

interface HotelCardProps {
  hotel: Hotel;
  rank?: number;
  cheapest?: boolean;
  closest?: boolean;
  selected?: boolean;
  onHover?: (hotelId: string | null) => void;
}

export function HotelCard({
  hotel,
  rank,
  cheapest,
  closest,
  selected,
  onHover,
}: HotelCardProps) {
  const stars = "★".repeat(hotel.stars) + "☆".repeat(5 - hotel.stars);

  return (
    <a
      href={hotel.bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl border transition-all group ${selected ? "border-cyan-500 bg-cyan-50/50 shadow-md" : "border-[#DDD6CB] bg-white hover:border-emerald-500/60 hover:shadow-sm"}`}
      onMouseEnter={() => onHover?.(hotel.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex gap-4 p-4">
        {/* Hotel image */}
        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-[#E8E2D9]">
          <img
            src={hotel.imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-800 truncate group-hover:text-emerald-600 transition-colors">
                {rank && (
                  <span className="text-zinc-400 font-normal mr-1.5 text-sm">
                    #{rank}
                  </span>
                )}
                {hotel.name}
              </h3>
              <div className="text-xs text-amber-500/80 mt-0.5">{stars}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-bold text-emerald-600">
                ${hotel.price}
              </div>
              <div className="text-xs text-zinc-400">per night</div>
            </div>
          </div>

          {/* Transit info */}
          <div className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
            <svg
              className="w-3.5 h-3.5 text-zinc-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <span className="font-medium text-zinc-700">
              {hotel.totalTransitMinutes} min
            </span>
            <span className="text-zinc-400">to venue</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
            <svg
              className="w-3 h-3 text-zinc-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h-.375a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3h1.922a3.75 3.75 0 0 1 2.69 1.131l.636.656a1.5 1.5 0 0 0 1.082.456h5.18a3 3 0 0 1 3 3v5.507a1.125 1.125 0 0 1-1.125 1.125H3.375Z"
              />
            </svg>
            <span className="text-zinc-500">
              {hotel.nearestStation.walkMinutes} min walk to{" "}
              {hotel.nearestStation.name}
            </span>
          </div>

          {/* Rating + tags */}
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#E8E2D9] px-2 py-0.5 text-xs font-medium text-zinc-600">
              {hotel.rating.toFixed(1)}
            </span>
            {cheapest && (
              <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                Best value
              </span>
            )}
            {closest && (
              <span className="inline-flex items-center rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                Closest
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Multi-venue distances */}
      {hotel.venueDistances && hotel.venueDistances.length > 1 && (
        <div className="border-t border-[#E8E2D9] px-4 py-2.5">
          <div className="space-y-1">
            {hotel.venueDistances.map((vd) => (
              <div
                key={vd.venueId}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-zinc-400 truncate mr-2">
                  {vd.venueName}
                </span>
                <span className="text-zinc-600 shrink-0">
                  {vd.totalMinutes} min
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </a>
  );
}
