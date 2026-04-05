"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Hotel, Match, Venue } from "@/types";
import { HotelCard } from "./HotelCard";
import { SearchFilters } from "./SearchFilters";
import { MapView } from "./MapView";

interface SearchResultsProps {
  hotels: Hotel[];
  matches: Match[];
  venues: Venue[];
  checkin: string;
  checkout: string;
  eventSlug: string;
  eventName: string;
}

export function SearchResults({
  hotels,
  matches,
  venues,
  checkin,
  checkout,
  eventSlug,
  eventName,
}: SearchResultsProps) {
  const [maxTransit, setMaxTransit] = useState(60);
  const [maxPrice, setMaxPrice] = useState(999);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<"transit" | "price" | "rating">(
    "transit",
  );
  const [hoveredHotel, setHoveredHotel] = useState<string | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = hotels.filter(
      (h) =>
        h.totalTransitMinutes <= maxTransit &&
        h.price <= maxPrice &&
        h.rating >= minRating,
    );

    result.sort((a, b) => {
      if (sortBy === "transit") return a.totalTransitMinutes - b.totalTransitMinutes;
      if (sortBy === "price") return a.price - b.price;
      return b.rating - a.rating;
    });

    return result;
  }, [hotels, maxTransit, maxPrice, minRating, sortBy]);

  const cheapestId = filtered.length
    ? filtered.reduce((min, h) => (h.price < min.price ? h : min), filtered[0]).id
    : null;
  const closestId = filtered.length
    ? filtered.reduce(
        (min, h) =>
          h.totalTransitMinutes < min.totalTransitMinutes ? h : min,
        filtered[0],
      ).id
    : null;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Top bar */}
      <div className="shrink-0 bg-[#F0EBE3] border-b border-[#DDD6CB] px-5 py-2 flex items-center gap-3 text-sm">
        <Link
          href={`/${eventSlug}/`}
          className="text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
        >
          &larr; {eventName}
        </Link>
        <div className="h-4 w-px bg-[#C8C1B6]" />
        <span className="text-zinc-500">
          {filtered.length} hotel{filtered.length !== 1 ? "s" : ""} near{" "}
          {venues.length} venue{venues.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 min-h-0">
        {/* Map panel */}
        <div className="w-[60%] min-h-0 bg-zinc-900 overflow-hidden">
          <MapView
            hotels={filtered}
            venues={venues}
            hoveredHotel={hoveredHotel}
            selectedHotel={selectedHotel}
            onHotelSelect={(id) => {
              setSelectedHotel(id);
              if (id) {
                const el = document.querySelector(`[data-hotel-id="${id}"]`);
                el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }
            }}
            onStationSelect={(name) => {
              setSelectedStation(name);
              if (name) {
                const match = filtered.find(
                  (h) => h.nearestStation.name === name,
                );
                if (match) {
                  const el = document.querySelector(
                    `[data-hotel-id="${match.id}"]`,
                  );
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }
            }}
          />
        </div>

        {/* Hotel panel */}
        <div className="w-[40%] flex flex-col bg-[#F0EBE3]">
          {/* Match info + filters header */}
          <div className="shrink-0 border-b border-[#DDD6CB] px-4 py-2.5 space-y-2">
            {/* Row 1: match info + dates on one line */}
            <div className="flex items-center gap-2 flex-wrap">
              {matches.map((match) => {
                const venue = venues.find((v) => v.id === match.venueId);
                return (
                  <div
                    key={match.id}
                    className="flex items-center gap-2 rounded-lg border border-[#DDD6CB] bg-white px-3 py-1.5 text-sm"
                  >
                    <span className="font-semibold text-zinc-800">
                      {match.teams[0]} vs {match.teams[1]}
                    </span>
                    <span className="text-zinc-400">
                      {match.date} · {match.time}
                      {venue && ` · ${venue.name}`}
                    </span>
                    {checkin && checkout && (
                      <span className="text-zinc-400 border-l border-[#DDD6CB] pl-2">
                        {checkin} → {checkout}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Row 2: filters + sort — single line */}
            <SearchFilters
              maxTransit={maxTransit}
              maxPrice={maxPrice}
              minRating={minRating}
              sortBy={sortBy}
              onMaxTransitChange={setMaxTransit}
              onMaxPriceChange={setMaxPrice}
              onMinRatingChange={setMinRating}
              onSortByChange={setSortBy}
            />
          </div>

          {/* Count + station filter */}
          <div className="shrink-0 px-4 py-2.5 border-b border-[#DDD6CB] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-700">
              {filtered.length} hotel{filtered.length !== 1 ? "s" : ""} found
            </h3>
            {selectedStation && (
              <button
                onClick={() => setSelectedStation(null)}
                className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-600" />
                {selectedStation} &times;
              </button>
            )}
          </div>

          {/* Hotel cards */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-zinc-500/80">
                  No hotels match your filters. Try increasing the transit time
                  or budget.
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {filtered.map((hotel, i) => {
                  const matchesStation =
                    !selectedStation ||
                    hotel.nearestStation.name === selectedStation;
                  return (
                    <div
                      key={hotel.id}
                      data-hotel-id={hotel.id}
                      onClick={() => setSelectedHotel(hotel.id)}
                      style={{
                        opacity: matchesStation ? 1 : 0.35,
                        transition: "opacity 0.2s ease",
                      }}
                    >
                      <HotelCard
                        hotel={hotel}
                        rank={i + 1}
                        cheapest={hotel.id === cheapestId}
                        closest={hotel.id === closestId}
                        selected={hotel.id === selectedHotel}
                        onHover={setHoveredHotel}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

