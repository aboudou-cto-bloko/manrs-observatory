import { useSearchParams, Link } from "react-router-dom"
import { ArrowLeft, MagnifyingGlass } from "@phosphor-icons/react"
import { api } from "@/lib/api"
import { useFetch } from "@/hooks/use-fetch"
import { Loading, ErrorMessage } from "@/components/atoms/loading"
import { COUNTRY_NAMES } from "@/lib/countries"

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") ?? ""

  const { data, loading, error } = useFetch(
    () => api.search(query),
    [query],
  )

  if (!query) {
    return (
      <div className="text-center py-20">
        <MagnifyingGlass size={32} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Entrez un terme de recherche</p>
      </div>
    )
  }

  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-1">
          Résultats pour « {query} »
        </h1>
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} résultat(s)</p>
      </div>

      {data && data.length > 0 ? (
        <div className="grid gap-2">
          {data.map((r) => (
            <Link key={r.asn_number} to={`/asn/${r.asn_number}`}>
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
                    AS
                  </div>
                  <div>
                    <p className="font-mono font-bold text-foreground">AS{r.asn_number}</p>
                    <p className="text-sm text-muted-foreground">{r.name ?? "Opérateur inconnu"}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {COUNTRY_NAMES[r.country_code] ?? r.country_code}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <MagnifyingGlass size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun résultat trouvé</p>
        </div>
      )}
    </div>
  )
}
