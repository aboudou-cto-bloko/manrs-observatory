import type {
  Country,
  CountryDetail,
  AsnDetail,
  GlobalStats,
  SearchResult,
} from "@/types/api"

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  getStats: () => fetchJson<GlobalStats>("/api/stats"),
  getCountries: () => fetchJson<Country[]>("/api/countries"),
  getCountry: (code: string) => fetchJson<CountryDetail>(`/api/countries/${code}`),
  getAsn: (number: number) => fetchJson<AsnDetail>(`/api/asn/${number}`),
  search: (query: string) => fetchJson<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`),
}
