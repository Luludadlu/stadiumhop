"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Hotel, Match, Venue } from "@/types";
import { HotelCard } from "./HotelCard";
import { SearchFilters } from "./SearchFilters";
import { MapView } from "./MapView";
import { getCountryFlag } from "@/lib/flags";

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
  const [editCheckin, setEditCheckin] = useState(checkin);
  const [editCheckout, setEditCheckout] = useState(checkout);

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

  const withPrice = filtered.filter((h) => h.price > 0);
  const cheapestId = withPrice.length
    ? withPrice.reduce((min, h) => (h.price < min.price ? h : min), withPrice[0]).id
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
      {/* Top bar — flags + teams centered */}
      <div className="shrink-0 bg-[#F0EBE3] border-b border-[#DDD6CB] px-5 py-3 flex items-center">
        <Link
          href={`/${eventSlug}/`}
          className="text-emerald-600 hover:text-emerald-700 transition-colors font-medium shrink-0 text-sm"
        >
          &larr; {eventName}
        </Link>
        <div className="flex-1 flex items-center justify-center gap-3">
          {matches.map((match) => {
            const flag1 = getCountryFlag(match.teams[0]);
            const flag2 = getCountryFlag(match.teams[1]);
            return (
              <div key={match.id} className="flex items-center gap-3">
                {flag1 && <span className="text-2xl">{flag1}</span>}
                <span className="font-bold text-lg text-zinc-800 tracking-tight">
                  {match.teams[0]}
                </span>
                <span className="text-zinc-400 text-sm font-medium">vs</span>
                <span className="font-bold text-lg text-zinc-800 tracking-tight">
                  {match.teams[1]}
                </span>
                {flag2 && <span className="text-2xl">{flag2}</span>}
              </div>
            );
          })}
        </div>
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
          {/* Row 1: venue, match time, editable dates */}
          <div className="shrink-0 border-b border-[#DDD6CB] px-4 py-3 space-y-1.5">
            {matches.map((match) => {
              const venue = venues.find((v) => v.id === match.venueId);
              return (
                <div key={match.id} className="flex items-center gap-2">
                  {venue && (
                    <span className="font-bold text-base text-zinc-800">
                      {venue.name}
                    </span>
                  )}
                  <span className="text-sm text-zinc-400">
                    {match.date} · {match.time}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 pt-1">
              <label className="text-xs text-zinc-500">Check-in</label>
              <input
                type="date"
                value={editCheckin}
                onChange={(e) => setEditCheckin(e.target.value)}
                className="rounded-md border border-[#DDD6CB] bg-white px-2 py-1 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <label className="text-xs text-zinc-500">Check-out</label>
              <input
                type="date"
                value={editCheckout}
                onChange={(e) => setEditCheckout(e.target.value)}
                className="rounded-md border border-[#DDD6CB] bg-white px-2 py-1 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 2: filters */}
          <div className="shrink-0 border-b border-[#DDD6CB] px-4 py-2">
            <SearchFilters
              maxTransit={maxTransit}
              maxPrice={maxPrice}
              minRating={minRating}
              onMaxTransitChange={setMaxTransit}
              onMaxPriceChange={setMaxPrice}
              onMinRatingChange={setMinRating}
            />
          </div>

          {/* Row 3: hotel count + sort + station filter */}
          <div className="shrink-0 px-4 py-2 border-b border-[#DDD6CB] flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-700 shrink-0">
              {filtered.length} hotel{filtered.length !== 1 ? "s" : ""} found
            </h3>
            <div className="flex items-center gap-3">
              {selectedStation && (
                <button
                  onClick={() => setSelectedStation(null)}
                  className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 shrink-0"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-600" />
                  {selectedStation} &times;
                </button>
              )}
              <div className="flex items-center gap-1.5 shrink-0">
                <label className="text-xs text-zinc-500">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "transit" | "price" | "rating")}
                  className="rounded-md border border-[#DDD6CB] bg-white px-2 py-1 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="transit">Transit time</option>
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>
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

