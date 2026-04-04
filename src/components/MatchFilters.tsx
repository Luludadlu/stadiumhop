"use client";

import { useState, useMemo } from "react";
import type { Match, Venue } from "@/types";
import { MatchCard } from "./MatchCard";

interface MatchFiltersProps {
  matches: Match[];
  venues: Venue[];
}

export function MatchFilters({ matches, venues }: MatchFiltersProps) {
  const [cityFilter, setCityFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [teamSearch, setTeamSearch] = useState("");

  const venueMap = useMemo(() => {
    const map = new Map<string, Venue>();
    for (const v of venues) map.set(v.id, v);
    return map;
  }, [venues]);

  const cities = useMemo(
    () => [...new Set(venues.map((v) => v.city))].sort(),
    [venues],
  );

  const stages = useMemo(
    () => [...new Set(matches.map((m) => m.stage))],
    [matches],
  );

  const filtered = useMemo(() => {
    let result = matches;

    if (cityFilter) {
      const venueIds = new Set(
        venues.filter((v) => v.city === cityFilter).map((v) => v.id),
      );
      result = result.filter((m) => venueIds.has(m.venueId));
    }

    if (stageFilter) {
      result = result.filter((m) => m.stage === stageFilter);
    }

    if (teamSearch) {
      const q = teamSearch.toLowerCase();
      result = result.filter((m) =>
        m.teams.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [matches, venues, cityFilter, stageFilter, teamSearch]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Stages</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search team..."
          value={teamSearch}
          onChange={(e) => setTeamSearch(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48"
        />

        {(cityFilter || stageFilter || teamSearch) && (
          <button
            onClick={() => {
              setCityFilter("");
              setStageFilter("");
              setTeamSearch("");
            }}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 mb-4">
        {filtered.length} match{filtered.length !== 1 ? "es" : ""}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((match) => {
          const venue = venueMap.get(match.venueId);
          if (!venue) return null;
          return <MatchCard key={match.id} match={match} venue={venue} />;
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-zinc-500 py-12">
          No matches found with current filters.
        </p>
      )}
    </div>
  );
}
