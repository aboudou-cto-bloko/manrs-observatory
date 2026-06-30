import { api } from "@/lib/api"
import { useFetch } from "@/hooks/use-fetch"
import { Loading, ErrorMessage } from "@/components/atoms/loading"
import { StatsBanner } from "@/components/molecules/stats-banner"
import { WestAfricaMap } from "@/components/organisms/west-africa-map"
import { CountriesChart } from "@/components/organisms/countries-chart"
import { CountriesTable } from "@/components/organisms/countries-table"

export function HomePage() {
  const stats = useFetch(() => api.getStats())
  const countries = useFetch(() => api.getCountries())

  if (stats.loading || countries.loading) return <Loading />
  if (stats.error) return <ErrorMessage message={stats.error} />
  if (countries.error) return <ErrorMessage message={countries.error} />
  if (!stats.data || !countries.data) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Sécurité du routage — Afrique de l'Ouest
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conformité MANRS et couverture RPKI des opérateurs réseau de 16 pays
        </p>
      </div>

      <StatsBanner stats={stats.data} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Carte interactive</h2>
            <p className="text-xs text-muted-foreground">Cliquer sur un pays pour voir le détail</p>
          </div>
          <WestAfricaMap countries={countries.data} />
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Couverture ROA par pays</h2>
            <p className="text-xs text-muted-foreground">Pourcentage de préfixes avec ROA valide</p>
          </div>
          <div className="p-4">
            <CountriesChart countries={countries.data} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Classement des 16 pays</h2>
        </div>
        <CountriesTable countries={countries.data} />
      </div>
    </div>
  )
}
