import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-emerald-600">Stadium</span>
            <span className="text-zinc-900">Hop</span>
          </span>
        </Link>
        <p className="text-sm text-zinc-500 hidden sm:block">
          Find hotels on the right transit line
        </p>
      </div>
    </header>
  );
}
