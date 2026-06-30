import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { MagnifyingGlass } from "@phosphor-icons/react"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const navigate = useNavigate()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    if (/^\d+$/.test(trimmed)) {
      navigate(`/asn/${trimmed}`)
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
    setQuery("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-sm">
      <div className="relative">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="ASN ou opérateur…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>
    </form>
  )
}
