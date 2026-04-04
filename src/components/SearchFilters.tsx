"use client";

interface SearchFiltersProps {
  maxTransit: number;
  maxPrice: number;
  minRating: number;
  sortBy: "transit" | "price" | "rating";
  onMaxTransitChange: (v: number) => void;
  onMaxPriceChange: (v: number) => void;
  onMinRatingChange: (v: number) => void;
  onSortByChange: (v: "transit" | "price" | "rating") => void;
}

export function SearchFilters({
  maxTransit,
  maxPrice,
  minRating,
  sortBy,
  onMaxTransitChange,
  onMaxPriceChange,
  onMinRatingChange,
  onSortByChange,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {/* Max transit time */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500 whitespace-nowrap">
          Max transit
        </label>
        <select
          value={maxTransit}
          onChange={(e) => onMaxTransitChange(Number(e.target.value))}
          className="rounded-md border border-[#DDD6CB] bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value={30}>30 min</option>
          <option value={45}>45 min</option>
          <option value={60}>60 min</option>
          <option value={90}>90 min</option>
          <option value={120}>120 min</option>
        </select>
      </div>

      {/* Max price */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500 whitespace-nowrap">
          Max price
        </label>
        <select
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(Number(e.target.value))}
          className="rounded-md border border-[#DDD6CB] bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value={50}>$50</option>
          <option value={100}>$100</option>
          <option value={150}>$150</option>
          <option value={200}>$200</option>
          <option value={999}>Any</option>
        </select>
      </div>

      {/* Min rating */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500 whitespace-nowrap">
          Min rating
        </label>
        <select
          value={minRating}
          onChange={(e) => onMinRatingChange(Number(e.target.value))}
          className="rounded-md border border-[#DDD6CB] bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value={0}>Any</option>
          <option value={3}>3.0+</option>
          <option value={3.5}>3.5+</option>
          <option value={4}>4.0+</option>
          <option value={4.5}>4.5+</option>
        </select>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-[#C8C1B6] hidden sm:block" />

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500 whitespace-nowrap">
          Sort by
        </label>
        <select
          value={sortBy}
          onChange={(e) =>
            onSortByChange(e.target.value as "transit" | "price" | "rating")
          }
          className="rounded-md border border-[#DDD6CB] bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="transit">Transit time</option>
          <option value="price">Price (low first)</option>
          <option value="rating">Rating (high first)</option>
        </select>
      </div>
    </div>
  );
}
