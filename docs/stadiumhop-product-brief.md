# StadiumHop — Product Brief

**Product**: StadiumHop — Transit-smart hotel discovery for major events
**Owner**: Skyscanner
**Date**: 2026-03-30
**Status**: POC / Proposal

---

## What problem are we solving — and for whom?

### Who is the specific user or segment?

Independent travelers attending major events globally — FIFA World Cup, Taylor Swift Eras Tour, Coachella, Wimbledon, F1 Grand Prix, etc. Budget-conscious but convenience-aware. Already using or likely to use Skyscanner for flights/hotels.

### What problem are we solving for them?

When a major event happens, hotels near venues spike 3-5x and sell out. Travelers manually cross-reference Google Maps transit routes with hotel search — a painful, repetitive workflow. **No travel platform surfaces hotels by transit accessibility to an event venue.**

The insight: a $45 hotel 48 min away on a direct train is better than a $200 hotel 2km away requiring a taxi. Skyscanner already has the hotel inventory and flight data — we just need to add the **event + transit** lens.

### What evidence shows this is a real problem or opportunity?

- "Hotels near \[event/venue\]" is a massive recurring search pattern (every major event, every year)
- Reddit/Twitter/travel forums: "where to stay for X" questions always center on transit
- Current Skyscanner hotel search = distance-based or area-based — no transit awareness, no event context
- Competitors (Booking, Expedia, Google Hotels) all sort by distance — none by transit route
- This is the exact manual workflow millions of travelers already do: event schedule → venue → Google Maps transit → hotel search → compare

---

## Why does this matter to the business?

| Objective | How StadiumHop supports it |
|---|---|
| Hotel vertical growth | Drives hotel searches with high purchase intent (event = fixed date = must book) |
| Cross-sell flights ↔ hotels | Event page naturally surfaces both — user picks a match, sees hotels + flights in one flow |
| SEO content moat | Evergreen, auto-updating pages for every major event — natural, high-intent organic traffic |
| Engagement & repeat visits | Events calendar gives users a reason to come back (next match, next festival, next tour date) |
| Affiliate revenue uplift | Transit-sorted results surface cheaper, further-out hotels users wouldn't otherwise find → incremental bookings |

---

## What outcome do we aim to drive?

**Primary metric:** Hotel search-to-click-through rate from event pages (engagement with high booking intent)

**Timeframe:** Launch FIFA module by June 11 2026. Measure over tournament (June 11 – July 19). Expand to 5+ event types by end of 2026.

**Guardrail metrics:**

1. Search completion rate (user selects event session → views hotel results)
2. Flight cross-sell rate (% of hotel searchers who also click flight links)

---

## What is our strategic approach?

### Core bet

Transit accessibility is a better hotel-sorting dimension than distance for event travelers. If users consistently engage with transit-sorted results, this becomes a differentiated feature no competitor has — powered by data Skyscanner already owns (hotel inventory) combined with a relatively cheap transit data layer.

### Principles

- **SEO-native, not a marketing page** — every event, city, and venue page is a real, useful, indexable page. No thin content. The schedule browser IS the content
- **Zero friction** — no login required for browsing or searching. Skyscanner account optional for saved trips (v2)
- **Event-agnostic architecture** — FIFA is the first instance. The system works for any event type: concerts, festivals, sports, conferences. One build, infinite events
- **Transit data quality > hotel quantity** — 20 well-connected hotels beat 200 random ones

### What we deliberately won't do (yet)

- No in-app booking (maintain redirect to Skyscanner hotel/flight pages)
- No user-generated content or reviews
- No price alerts in v1
- No multi-language in v1 (English first, then expand)

---

## What are the biggest risks?

| Risk | Mitigation | Pivot/stop signal |
|---|---|---|
| Transit data coverage varies by city (some cities have poor transit) | Pre-compute per venue; for transit-poor cities, fall back to shuttle/rideshare info | If >30% of venues have <3 usable transit stations, model breaks for those cities |
| Event data curation at scale (hundreds of events/year) | Start with structured feeds (FIFA official, Ticketmaster API, Bandsintown). Curate top 20 events manually, automate the long tail | If manual curation >2hrs/event, need automation or partnerships |
| Users don't understand transit-first sorting | Show transit time prominently on every card + map visualization. A/B test vs distance sort | If >70% immediately switch to sort-by-distance, value prop isn't landing |
| SEO pages don't rank fast enough for FIFA | Start publishing city/venue pages early (April). Leverage Skyscanner domain authority | If pages aren't indexed by May, SEO strategy for FIFA fails — rely on direct/social |
| Cannibalizes existing Skyscanner hotel search | These are additive searches — event travelers searching "hotels near MetLife" aren't currently landing on Skyscanner | Monitor if core hotel search traffic drops (unlikely) |

---

## How will we execute?

### Rough timeline (FIFA as first event)

| Phase | Dates | Deliverables |
|---|---|---|
| 1. Foundation | Apr 1-15 | Next.js setup, event/venue/transit data model, routing, static data for FIFA |
| 2. Core Search | Apr 16-30 | Hotel search API (Skyscanner internal), results page with transit sorting |
| 3. Map & UX | May 1-20 | Mapbox integration, transit line overlay, Mode C interaction |
| 4. Multi-venue & Flights | May 21-31 | Multi-match optimization, flight cross-sell module |
| 5. Polish & Launch | Jun 1-10 | SEO, performance, mobile polish, production deploy |
| 6. Post-FIFA expansion | Jul-Dec | Add concert tours, festivals, tennis opens, F1 etc. |

**Hard deadline:** June 11, 2026 (FIFA opening match)

### Key dependencies

- Skyscanner Hotels API (internal — already have access)
- Skyscanner Flights API (internal — affiliate link generation)
- Google Maps Directions API (transit mode, mostly pre-computed)
- Google Maps JS API (maps + transit + directions in one SDK)
- Event schedule data sources (FIFA official, future: Ticketmaster, Bandsintown)

---

## Revenue Model

| Stream | Timing | Details |
|---|---|---|
| Hotel affiliate commission | v1 (POC) | Travelpayouts (Booking.com, Agoda, Hostelworld). Production: Skyscanner internal |
| Flight affiliate commission | v1 | Skyscanner affiliate links with pre-filled dates/routes |
| Google Ads | v1 | Display ads on search results and event pages — offsets Google Maps API costs from launch |

Zero upfront cost to users. Google Ads is included from v1 because Google Maps API has real costs beyond the $200/mo free credit.

---

## POC vs Potential next steps

### What is part of the POC

- FIFA World Cup 2026 (11 cities, 16 venues, full match schedule)
- Single & multi-match hotel search with transit-first sorting
- Interactive map with transit lines
- Flight cross-sell module
- SEO-friendly city/venue pages (natural content, not landing pages)

### Shareable?

Yes — public pages under Skyscanner domain or subdomain (e.g. `events.skyscanner.net` or `/events/fifa-2026/`)

### Login required?

No. Fully open. Skyscanner login optional for future saved trips feature.

### Required data sources

| Data | Source | Notes |
|---|---|---|
| Hotel inventory + pricing | Travelpayouts API (POC) → Skyscanner internal API (production) | POC uses Travelpayouts (free affiliate, Booking.com/Agoda/Hostelworld). Production migrates to Skyscanner internal API |
| Flight pricing + deep links | Skyscanner internal API | Real-time |
| Event schedules | FIFA official → future: Ticketmaster/Bandsintown APIs | Static per event, updated periodically |
| Venue locations + transit stations | Pre-computed via Google Maps | Stored as static data |
| User location (flight origin) | IP geolocation | Free tier API |

### Where / how to promote

| Channel | Approach |
|---|---|
| Organic/SEO | City & venue pages rank for "FIFA 2026 hotels \[city\]", "\[event\] accommodation near \[venue\]" — natural, content-rich pages |
| Skyscanner homepage/app | Banner or module during FIFA period. Future: permanent "Events" tab |
| Social | Reddit (r/worldcup, r/travel), Twitter/X, travel communities |
| PR | "Skyscanner launches transit-smart hotel finder for FIFA 2026" |
| Email | Skyscanner newsletter to users who've searched for FIFA host cities |

### Possible future iterations

- Full events calendar: concerts, festivals, F1, tennis opens, etc.
- Reverse search: "I'm staying at this hotel — what events are nearby this week?"
- Price alerts: "Notify me when hotels on the MetLife transit line drop below $80"
- Saved trips with Skyscanner account
- Multi-language (Spanish, French, Chinese, Korean, Japanese)
- Integration into Skyscanner core funnel (hotel search → "Attending an event?" prompt)
- Group booking optimization (party of 4+ → suggest adjacent rooms/apartment hotels)
- Partnership with event organizers for official accommodation pages
- ~~Google Ads monetization~~ (moved to v1 — see Revenue Model below)

### Can it tie into core funnels?

Yes, directly:

- Every hotel card → Skyscanner hotel booking page (internal deep link)
- Every flight module → Skyscanner flights page with pre-filled origin/destination/dates
- Event pages become top-of-funnel SEO content that feeds into existing hotel + flight search
- Future: "Events near your destination" module inside core hotel search results

---

## Anything else relevant?

### Competitive landscape

| Tool | What it does | Gap |
|---|---|---|
| Google Maps hotel search | Distance-based | No event context |
| Booking.com "near landmark" | Distance only | No transit routing |
| Rome2Rio | Transit routing | No hotel integration |
| Hotelmap.com | Map-based hotel search | No transit or event awareness |

**No known product combines event schedule + transit routing + hotel search.**

### Skyscanner advantage

- Already has hotel inventory, pricing, and booking infrastructure
- Domain authority for SEO (skyscanner.net is a trusted travel domain)
- Cross-sell opportunity (flights + hotels in one event flow)
- Existing user base to promote to
