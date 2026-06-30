import { useParams, Link } from "react-router-dom"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ArrowLeft } from "@phosphor-icons/react"
import { api } from "@/lib/api"
import { useFetch } from "@/hooks/use-fetch"
import { Loading, ErrorMessage } from "@/components/atoms/loading"
import { Badge } from "@/components/ui/badge"
import { ManrsScoreCard } from "@/components/molecules/manrs-scorecard"
import { PrefixesTable } from "@/components/organisms/prefixes-table"
import { COUNTRY_NAMES } from "@/lib/countries"

export function AsnDetailPage() {
  const { number } = useParams<{ number: string }>()
  const { data, loading, error } = useFetch(
    () => api.getAsn(Number(number)),
    [number],
  )

  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error} />
  if (!data) return null

  const valid = data.prefixes.filter((p) => p.roa_status === "valid").length
  const invalid = data.prefixes.filter((p) => p.roa_status === "invalid").length
  const notFound = data.prefixes.filter((p) => p.roa_status === "not-found").length
  const total = data.prefixes.length

  const pieData = [
    { name: "Valid", value: valid, color: "#22c55e" },
    { name: "Invalid", value: invalid, color: "#ef4444" },
    { name: "Not Found", value: notFound, color: "#f59e0b" },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/country/${data.country_code}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={12} /> {COUNTRY_NAMES[data.country_code] ?? data.country_code}
        </Link>

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight font-mono">
            AS{data.asn_number}
          </h1>
          <span className="text-lg text-muted-foreground">
            {data.name ?? "Opérateur inconnu"}
          </span>
          {data.is_manrs_member ? (
            <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">
              Membre MANRS
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Non membre
            </Badge>
          )}
        </div>

        {data.last_updated && (
          <p className="text-xs text-muted-foreground mt-1">
            Mis à jour le {new Date(data.last_updated).toLocaleDateString("fr-FR")}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ManrsScoreCard actions={data.actions} />

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Répartition ROA — {total} préfixes
          </h3>
          {total > 0 ? (
            <div className="flex items-center gap-6">
              <div className="relative h-32 w-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="100%"
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">
                    {data.roa_coverage_pct}%
                  </span>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Valid</span>
                  <span className="ml-auto font-mono font-bold text-green-400">{valid}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Invalid</span>
                  <span className="ml-auto font-mono font-bold text-red-400">{invalid}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span className="text-muted-foreground">Not Found</span>
                  <span className="ml-auto font-mono font-bold text-yellow-400">{notFound}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Aucun préfixe trouvé
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Préfixes annoncés</h2>
          <span className="text-xs text-muted-foreground font-mono">{total} préfixes</span>
        </div>
        {total > 0 ? (
          <PrefixesTable prefixes={data.prefixes} />
        ) : (
          <p className="text-muted-foreground text-sm py-8 text-center">
            Aucun préfixe trouvé pour cet ASN.
          </p>
        )}
      </div>
    </div>
  )
}
