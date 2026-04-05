import { NextRequest, NextResponse } from "next/server";
import { getVenue } from "@/lib/data";
import { fetchRealHotels } from "@/lib/google-places";
import { generateMockHotels } from "@/lib/mock-hotels";
import type { Venue } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const venueIds = searchParams.get("venues")?.split(",").filter(Boolean) ?? [];
  const maxTransit = Number(searchParams.get("maxTransit")) || 90;
  const maxPrice = Number(searchParams.get("maxPrice")) || 999;
  const minRating = Number(searchParams.get("minRating")) || 0;
  const sortBy = searchParams.get("sortBy") || "transit";
  const checkin = searchParams.get("checkin") || undefined;
  const checkout = searchParams.get("checkout") || undefined;

  if (venueIds.length === 0) {
    return NextResponse.json(
      { error: "At least one venue ID is required (e.g., ?venues=metlife)" },
      { status: 400 },
    );
  }

  const venues: Venue[] = [];
  for (const id of venueIds) {
    const venue = getVenue(id);
    if (venue) venues.push(venue);
  }

  if (venues.length === 0) {
    return NextResponse.json(
      { error: "No valid venues found for the provided IDs" },
      { status: 404 },
    );
  }

  // Try real hotels first, fall back to mock if API fails
  let hotels = await fetchRealHotels(venues, { maxTransit, checkin, checkout });

  if (hotels.length === 0) {
    hotels = generateMockHotels(venues, { maxTransit, minRating, maxPrice });
  }

  // Apply filters
  if (minRating > 0) {
    hotels = hotels.filter((h) => h.rating >= minRating);
  }

  if (sortBy === "price") {
    hotels.sort((a, b) => a.price - b.price);
  } else if (sortBy === "rating") {
    hotels.sort((a, b) => b.rating - a.rating);
  }

  return NextResponse.json({
    hotels,
    totalCount: hotels.length,
    venues: venues.map((v) => ({ id: v.id, name: v.name, city: v.city })),
  });
}
