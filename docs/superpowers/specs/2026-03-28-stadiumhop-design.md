# StadiumHop — Design Spec

**Product**: StadiumHop — Find hotels on the right transit line for major events
**Date**: 2026-03-28
**Target Launch**: June 2026 (before FIFA World Cup kickoff June 11)
**Author**: Side project, independent website

---

## 1. Problem

When major events (FIFA, concerts, festivals) happen, hotels near venues sell out fast and prices spike. But hotels further away — on the same metro/train line — are often much cheaper and just as convenient. No existing platform helps users find hotels by **transit accessibility** rather than pure distance.

## 2. Product Vision

StadiumHop helps event-goers find affordable hotels along public transit routes to venues. The core insight: a $45 hotel 48 minutes away on a direct train is better than a $200 hotel 2km away requiring a taxi.

**MVP scope**: FIFA World Cup 2026 only (11 cities, 16 venues). Architecture designed to support multiple events — each event lives under its own URL slug (e.g., `/fifa-2026/`). Future events (Kpop tours, tennis opens, festivals) can be added as new event entries without changing the core architecture.

## 3. Target User

- Independent travelers (not group tours)
- International and domestic FIFA fans
- Budget-conscious but convenience-aware
- No login required — zero-friction access

## 4. Language

- English only for MVP

## 5. Architecture

### 5.1 Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Next.js (App Router) | SSR for SEO, API routes for backend |
| Map | Google Maps JS API | Single SDK for maps + transit + directions, simplifies dependencies |
| Hotel Data | Skyscanner Affiliate API | Direct Skyscanner integration, affiliate revenue |
| Transit Routing | Google Maps Directions API (transit mode) | Best global transit data coverage |
| Flight Links | Skyscanner Flights (affiliate link) | Smart redirect with pre-filled city + dates |
| Static Data | JSON files | Venues, matches, transit stations — rarely change |
| Styling | Tailwind CSS | Fast development, responsive |
| Deployment | Vercel | Zero-config Next.js hosting |

### 5.2 URL Structure

```
/                              → Event list (homepage)
/fifa-2026/                    → FIFA 2026 match schedule
/fifa-2026/search              → Hotel search results
/fifa-2026/city/new-york       → City page (SEO)
/fifa-2026/venue/metlife       → Venue page (SEO)
/api/hotels                    → Hotel search API (shared across events)
/api/transit/detail            → Transit detail API (shared across events)
```

Each event lives under its own slug (`/fifa-2026/`, `/kpop-blackpink-2027/`, etc.). API routes are shared — they operate on venue/station coordinates, not event-specific data.

### 5.3 System Overview

```
┌─────────────────────────────────────────────────┐
│                   StadiumHop                     │
│               Next.js App Router                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  Static Data Layer (JSON files)                  │
│  ├── events.json — event registry                │
│  ├── venues.json — 16 venues with coords, city   │
│  ├── fifa-2026/matches.json — matches w/ teams   │
│  └── transit-stations.json — pre-computed         │
│       reachable stations per venue                │
│       (line name, transit time, walk time)        │
│                                                  │
│  Pages                                           │
│  ├── / — Homepage: event list (currently FIFA)   │
│  ├── /fifa-2026/ — FIFA match schedule browser   │
│  └── /fifa-2026/search — Hotel results: map+list │
│                                                  │
│  API Routes                                      │
│  ├── /api/hotels — Proxy to Skyscanner API       │
│  └── /api/transit/detail — Proxy to Google Maps  │
│                                                  │
│  Client                                          │
│  ├── Google Maps JS API with transit line overlay      │
│  └── Interactive station + hotel markers         │
│                                                  │
└──────────┬──────────┬──────────┬────────────────┘
           │          │          │
           ▼          ▼          ▼
     Skyscanner   Google Maps   Google Maps
     Hotels API   Directions    Tiles
```

### 5.4 Pre-computed Transit Data

The transit station data for each venue is **pre-computed once** (using Google Maps Transit API during development) and stored as static JSON. This avoids real-time transit API calls on every search.

For each venue, we store all reachable metro/train stations with:
- Station name and coordinates
- Transit line name(s)
- Transit time to venue (minutes)
- Walking time from station exit (minutes)

This data is stable — transit infrastructure doesn't change.

## 6. Data Models

### Design Principle

**Compromise approach**: Core types (`Event`, `Venue`, `TransitStation`) are generic and reusable across all events. Event-specific concepts (e.g., FIFA's `Match` with teams/stage) are kept as separate types that reference the core types. This avoids over-abstraction while keeping the door open for new event types.

### 6.1 Event (generic)

```typescript
interface Event {
  id: string;                    // URL slug, e.g., "fifa-2026"
  name: string;                  // "FIFA World Cup 2026"
  shortName: string;             // "FIFA 2026"
  description: string;           // Brief tagline
  startDate: string;             // "2026-06-11"
  endDate: string;               // "2026-07-19"
  imageUrl: string;              // Event card image
  venueIds: string[];            // references Venue.id[]
  type: EventType;               // categorization
}

type EventType = "sports" | "concert" | "festival" | "tennis" | "other";
```

### 6.2 Venue (generic)

```typescript
interface Venue {
  id: string;                    // e.g., "metlife"
  name: string;                  // "MetLife Stadium"
  city: string;                  // "New York/New Jersey"
  coords: { lat: number; lng: number };
  transitStations: TransitStation[];
}

interface TransitStation {
  name: string;                  // "Secaucus Junction"
  coords: { lat: number; lng: number };
  lines: string[];               // ["NJ Transit Northeast Corridor"]
  transitMinutes: number;        // time from this station to venue
  walkMinutes: number;           // walk from station exit to venue entrance
}
```

### 6.3 Match (FIFA-specific)

```typescript
interface Match {
  id: string;                    // "m001"
  eventId: string;               // "fifa-2026"
  date: string;                  // "2026-06-11"
  time: string;                  // "18:00"
  venueId: string;               // references Venue.id
  teams: [string, string];       // ["Mexico", "TBD"]
  stage: string;                 // "Group A"
  matchday: number;
}
```

> **Note**: `Match` is a FIFA-specific type. Future events may define their own sub-event types (e.g., `ConcertShow`, `TennisMatch`) or simply use the `Event` + `Venue` pair directly if no sub-events are needed.

### 6.4 Hotel (API response)

```typescript
interface Hotel {
  id: string;
  name: string;
  coords: { lat: number; lng: number };
  price: number;                 // per night, USD
  rating: number;                // 1-5
  stars: number;                 // hotel star rating
  imageUrl: string;
  bookingUrl: string;            // Skyscanner affiliate link
  nearestStation: {
    name: string;
    walkMinutes: number;         // walk from hotel to station
  };
  totalTransitMinutes: number;   // walk to station + transit to venue
  venueDistances?: VenueDistance[]; // for multi-venue mode
}

interface VenueDistance {
  venueId: string;
  venueName: string;
  totalMinutes: number;
  route: string;                 // e.g., "NJ Transit → Meadowlands"
}
```

## 7. Pages & User Flow

### 7.1 Homepage (`/`)

**Purpose**: Event directory — browse available events, pick one to explore.

**Layout**:
- Header: StadiumHop logo + tagline ("Find hotels on the right transit line")
- Event cards: Each shows event name, dates, city count, venue count, image
- Click card → navigate to event page (e.g., `/fifa-2026/`)

**Data**: All event data loaded at build time (SSG).

> **MVP**: Only one event (FIFA 2026), so the homepage is a simple single-card page. As events are added, this becomes a browseable grid/list.

### 7.2 Event Page (`/fifa-2026/`)

**Purpose**: Browse FIFA 2026 matches, select one or more to find hotels.

**Layout**:
- Event header: FIFA 2026 branding, date range, city overview
- Filters: Date picker, City dropdown, Team search
- Match cards: Each shows teams, date, venue, city
- Two actions per card:
  - "Find Hotels" → single match search
  - "+ Add to trip" → multi-match mode
- Multi-match banner at bottom: shows selected count, "Search Hotels for All" button

**Data**: All match/venue data loaded at build time (SSG).

### 7.3 Search Results (`/fifa-2026/search`)

**Purpose**: Core experience — find and compare hotels along transit lines.

**URL params**: `?matches=m001,m002&maxTransit=60&checkin=2026-06-14&checkout=2026-06-16`

**Layout**:
- Top bar: Selected match info, filters (max transit time, budget range, min rating)
- Split view:
  - Left (60%): Google Maps map
  - Right (40%): Scrollable hotel list

**Map interaction (Mode C — combined)**:
- Default: All transit lines highlighted, all hotels shown as small dots with price labels
- Click a station → station highlights, nearby hotels enlarge with full info, other hotels dim, list filters to that station's hotels
- Click elsewhere / "Show All" button → resets to default view
- Stadium marker always visible (red, prominent)
- Transit lines color-coded by line name

**Hotel list**:
- Sorted by total transit time (ascending) by default
- Sort options: transit time, price, rating
- Each card shows: hotel name, price/night, star rating, nearest station, total transit time
- Special tags: "Best value" (cheapest with <45min transit), "Closest" (shortest transit)
- Click card → open Skyscanner booking in new tab (affiliate link)
- Hover card → highlight hotel on map

**Multi-venue mode**:
- Each hotel card shows transit time to **each** selected venue
- Sort by maximum transit time across all venues (worst-case optimization)
- Map shows all venue markers and all relevant transit lines

**Flight module** (top of results page):
- Auto-detected user city (IP geolocation), editable
- Pre-filled dates (day before first match → day after last match)
- Shows cheapest indicative price if available
- "View flights on Skyscanner →" affiliate link

## 8. API Design

### 8.1 Hotel Search

```
GET /api/hotels
  ?stations=40.81,-74.07|40.76,-74.02|...   // pipe-separated station coords
  &checkin=2026-06-14
  &checkout=2026-06-16
  &maxTransit=60                              // optional, minutes
  &minRating=3                                // optional, 1-5
  &maxPrice=200                               // optional, USD/night
  &currency=USD                               // optional

Response: {
  hotels: Hotel[],
  totalCount: number,
  searchRadius: number      // km around each station
}
```

**Logic**:
1. Parse station coordinates from query
2. For each station, call Skyscanner Affiliate API with ~1km radius
3. Deduplicate hotels (same hotel found near multiple stations)
4. For duplicates, keep the entry with shortest transit time
5. Apply filters (maxTransit, minRating, maxPrice)
6. Sort by totalTransitMinutes ascending
7. Return with affiliate booking URLs

### 8.2 Transit Detail

```
GET /api/transit/detail
  ?origin=40.75,-73.99          // hotel coords
  &destination=40.81,-74.07     // venue coords
  &date=2026-06-15
  &arriveBy=17:00               // optional, arrive before match time

Response: {
  routes: [{
    duration: number,           // total minutes
    steps: string[],            // human-readable directions
    departureTime: string,
    arrivalTime: string,
    transitLines: string[]
  }]
}
```

**Purpose**: Only called when user clicks a specific hotel for detailed route info. Not used in initial search (pre-computed data handles that).

## 9. Multi-Venue Optimization

When user selects multiple matches (same city or adjacent cities within user's max transit time):

1. Collect `transitStations` from all selected venues
2. Merge station lists, keeping unique stations
3. For each station, search hotels via Skyscanner API
4. For each hotel, calculate transit time to **every** selected venue
5. Filter: only include hotels where ALL venue transit times ≤ user's maxTransit
6. Sort by: `max(transitTime to each venue)` — optimizes worst-case commute
7. Display: each hotel card shows breakdown per venue

**Adjacent city detection**: If selected matches are in different cities, check if any transit stations are shared or connected within the user's maxTransit setting. If no station serves all venues within the limit, show a notice: "These venues are too far apart for a single hotel. Consider booking separately."

## 10. MVP Feature List

### Included (v1.0)

- [x] FIFA 2026 match schedule (16 venues, 11 cities)
- [x] Single match → hotel search along transit lines
- [x] Multi-match → optimized hotel search across venues
- [x] Interactive map with transit line overlay (Google Maps)
- [x] Mode C interaction: all hotels visible + click station to focus
- [x] Filters: max transit time, budget range, star rating
- [x] Hotel list with transit time, price, rating, nearest station
- [x] Flight recommendation module (smart Skyscanner redirect)
- [x] Jump to Skyscanner for booking (affiliate links)
- [x] Mobile responsive design
- [x] English language

### Excluded (v2+)

- [ ] Other events (Kpop, tennis, music festivals)
- [ ] User accounts / login
- [ ] Price alerts / drop notifications
- [ ] Reverse search (hotel → nearby events)
- [ ] Multi-language support
- [ ] Native mobile app
- [ ] User reviews / community features
- [ ] In-app booking (keep redirect model)

## 11. External API Dependencies

| API | Free Tier | Estimated Usage | Cost Risk |
|-----|-----------|-----------------|-----------|
| Google Maps JS API | $200/mo free credit | Maps + transit + directions in one SDK | Low — free credit covers early usage |
| Google Maps Directions | $5/1000 requests | Pre-compute: ~500 calls total; Runtime: ~50/day | Very low — mostly pre-computed |
| Skyscanner Affiliate API | Free (affiliate) | ~100-500 searches/day | Free — revenue share model |
| IP Geolocation | Free tier (ipapi/ipinfo) | ~100-500/day | Free tier sufficient |

## 12. SEO Strategy

FIFA-related search terms will drive organic traffic:

- Event page: `/fifa-2026/` — "FIFA 2026 hotels", "FIFA World Cup accommodation"
- Static pages per city: `/fifa-2026/city/new-york`, `/fifa-2026/city/los-angeles`
- Static pages per venue: `/fifa-2026/venue/metlife-stadium`
- SSG for all match schedule pages
- Meta tags optimized for: "FIFA 2026 hotels [city]", "hotels near [venue]", "FIFA World Cup accommodation"
- Future events get their own SEO-friendly slugs (e.g., `/kpop-blackpink-2027/`)

## 13. Revenue Model

- **Hotel booking commission**: Skyscanner affiliate revenue on hotel bookings
- **Flight referral commission**: Skyscanner affiliate revenue on flight bookings
- Zero upfront cost to users

## 14. Timeline

| Phase | Timeframe | Deliverables |
|-------|-----------|-------------|
| 1. Foundation | Apr 1-15 | Next.js setup, static data (venues/matches/stations), basic routing |
| 2. Core Search | Apr 16-30 | Hotel search API, Skyscanner integration, search results page |
| 3. Map & UX | May 1-20 | Google Maps integration, Mode C interaction, transit line rendering |
| 4. Multi-venue & Flights | May 21-31 | Multi-match optimization, flight module, mobile responsive |
| 5. Polish & Launch | Jun 1-10 | SEO, performance, testing, deploy to production |

**Hard deadline**: June 11, 2026 (FIFA opening match)
