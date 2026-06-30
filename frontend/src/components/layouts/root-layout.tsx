import { Link, Outlet, useLocation } from "react-router-dom"
import { SearchBar } from "@/components/molecules/search-bar"
import { ShieldCheck } from "@phosphor-icons/react"

export function RootLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex items-center justify-between gap-4 px-6 py-3 max-w-7xl">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <ShieldCheck size={24} weight="duotone" className="text-primary" />
            <span className="text-sm font-bold tracking-tight hidden sm:block">
              MANRS Observatory
            </span>
          </Link>

          <SearchBar />

          <nav className="flex gap-1 text-sm shrink-0">
            <Link
              to="/"
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                location.pathname === "/" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/about"
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                location.pathname === "/about" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              A propos
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
