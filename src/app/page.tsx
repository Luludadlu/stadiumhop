import { getEvents } from "@/lib/data";
import { EventCard } from "@/components/EventCard";

export default function HomePage() {
  const events = getEvents();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Find hotels on the{" "}
          <span className="text-emerald-600">right transit line</span>
        </h1>
        <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
          Stop overpaying for hotels near the venue. Find cheaper stays along
          direct train and metro lines — just as convenient, a fraction of the
          price.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
          Upcoming Events
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}
