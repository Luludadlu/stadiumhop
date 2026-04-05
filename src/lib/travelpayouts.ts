/**
 * Travelpayouts affiliate link generation.
 *
 * Note: Travelpayouts Hotel Data API (Hotellook) has been discontinued.
 * We use mock hotel data for display and generate real Travelpayouts
 * affiliate deep links for booking redirects (→ Booking.com / Hotellook).
 */

const MARKER = process.env.TRAVELPAYOUTS_TOKEN || "";

/**
 * Generate a Travelpayouts affiliate booking link.
 * Redirects user to Hotellook/Booking.com with our affiliate marker.
 */
export function buildAffiliateBookingUrl(
  city: string,
  checkin: string,
  checkout: string,
  hotelName?: string,
): string {
  const params = new URLSearchParams({
    marker: MARKER,
    adults: "2",
    checkIn: checkin,
    checkOut: checkout,
    destination: hotelName ? `${hotelName}, ${city}` : city,
    currency: "usd",
    utm_campaign: "stadiumhop",
    utm_medium: "affiliate",
  });
  return `https://search.hotellook.com/hotels?${params.toString()}`;
}

/**
 * Generate a Travelpayouts flight affiliate link.
 */
export function buildFlightAffiliateUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
): string {
  const params = new URLSearchParams({
    marker: MARKER,
    origin_iata: origin,
    destination_iata: destination,
    depart_date: departureDate,
    currency: "usd",
    utm_campaign: "stadiumhop",
    utm_medium: "affiliate",
  });
  if (returnDate) params.set("return_date", returnDate);
  return `https://www.aviasales.com/search/${origin}${departureDate.replace(/-/g, "").slice(2)}${destination}${returnDate ? returnDate.replace(/-/g, "").slice(2) : ""}1?marker=${MARKER}`;
}
