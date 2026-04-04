/**
 * Detailed transit line routes with all intermediate stations.
 * Keyed by venue ID. Each venue has multiple lines, each line has
 * an ordered array of stations from one terminus toward the venue.
 */

export interface RouteStation {
  name: string;
  lat: number;
  lng: number;
}

export interface TransitLine {
  name: string;
  color: string;
  /** Stations in geographic order (first = furthest from venue) */
  stations: RouteStation[];
}

export const transitRoutesByVenue: Record<string, TransitLine[]> = {
  // ─── MetLife Stadium ─────────────────────────────────────────
  metlife: [
    {
      name: "NJ Transit Northeast Corridor",
      color: "#0077C0", // NJ Transit blue
      stations: [
        { name: "New York Penn Station", lat: 40.7505, lng: -73.9935 },
        { name: "Secaucus Junction", lat: 40.7614, lng: -74.0758 },
        { name: "Frank R. Lautenberg", lat: 40.7610, lng: -74.0755 }, // same complex, skip render
        { name: "Newark Broad St", lat: 40.7440, lng: -74.1700 },
        { name: "Newark Penn Station", lat: 40.7345, lng: -74.1644 },
        { name: "Newark Airport", lat: 40.7024, lng: -74.1879 },
        { name: "Elizabeth", lat: 40.6682, lng: -74.2150 },
      ],
    },
    {
      name: "Meadowlands Rail Line",
      color: "#E86C00", // Orange
      stations: [
        { name: "Secaucus Junction", lat: 40.7614, lng: -74.0758 },
        { name: "Meadowlands Station", lat: 40.8122, lng: -74.0720 },
      ],
    },
    {
      name: "PATH",
      color: "#0039A6", // PATH dark blue
      stations: [
        { name: "33rd Street", lat: 40.7484, lng: -73.9883 },
        { name: "23rd Street", lat: 40.7428, lng: -73.9927 },
        { name: "14th Street", lat: 40.7373, lng: -73.9971 },
        { name: "9th Street", lat: 40.7341, lng: -73.9991 },
        { name: "Christopher Street", lat: 40.7327, lng: -74.0070 },
        { name: "Hoboken Terminal", lat: 40.7352, lng: -74.0281 },
      ],
    },
    {
      name: "PATH Newark–WTC",
      color: "#0039A6",
      stations: [
        { name: "World Trade Center", lat: 40.7127, lng: -74.0099 },
        { name: "Exchange Place", lat: 40.7163, lng: -74.0327 },
        { name: "Grove Street", lat: 40.7196, lng: -74.0431 },
        { name: "Journal Square", lat: 40.7332, lng: -74.0634 },
        { name: "Harrison", lat: 40.7388, lng: -74.1559 },
        { name: "Newark Penn Station", lat: 40.7345, lng: -74.1644 },
      ],
    },
    {
      name: "NJ Transit Main/Bergen Line",
      color: "#00A94F", // Green
      stations: [
        { name: "Secaucus Junction", lat: 40.7614, lng: -74.0758 },
        { name: "Rutherford", lat: 40.8247, lng: -74.1076 },
        { name: "Lyndhurst", lat: 40.8116, lng: -74.1172 },
        { name: "Wood-Ridge", lat: 40.8475, lng: -74.0876 },
      ],
    },
    {
      name: "NY Waterway Ferry",
      color: "#00A4E4", // Light blue
      stations: [
        { name: "Midtown/W 39th St", lat: 40.7601, lng: -74.0003 },
        { name: "Port Imperial", lat: 40.7731, lng: -74.0131 },
        { name: "Hoboken 14th St", lat: 40.7461, lng: -74.0258 },
        { name: "Hoboken Terminal", lat: 40.7352, lng: -74.0281 },
      ],
    },
  ],

  // ─── SoFi Stadium ───────────────────────────────────────────
  sofi: [
    {
      name: "LA Metro K Line",
      color: "#E16D00",
      stations: [
        { name: "Expo/Crenshaw", lat: 34.0233, lng: -118.3266 },
        { name: "Leimert Park", lat: 34.0098, lng: -118.3309 },
        { name: "Hyde Park", lat: 33.9974, lng: -118.3328 },
        { name: "Fairview Heights", lat: 33.9855, lng: -118.3403 },
        { name: "Downtown Inglewood", lat: 33.9617, lng: -118.3531 },
        { name: "Westchester/Veterans", lat: 33.9584, lng: -118.3735 },
        { name: "Aviation/Century", lat: 33.9425, lng: -118.3808 },
      ],
    },
    {
      name: "LA Metro C Line (Green)",
      color: "#59A738",
      stations: [
        { name: "Norwalk", lat: 33.9137, lng: -118.1070 },
        { name: "Lakewood Blvd", lat: 33.9186, lng: -118.1317 },
        { name: "Long Beach Blvd", lat: 33.9155, lng: -118.1757 },
        { name: "Willowbrook/Rosa Parks", lat: 33.9268, lng: -118.2381 },
        { name: "Hawthorne/Lennox", lat: 33.9381, lng: -118.3500 },
        { name: "Aviation/Century", lat: 33.9425, lng: -118.3808 },
      ],
    },
  ],

  // Add more venues as needed...
};
