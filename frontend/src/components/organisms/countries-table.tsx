import { Link } from "react-router-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { roaColorHex } from "@/lib/countries"
import type { Country } from "@/types/api"

interface CountriesTableProps {
  countries: Country[]
}

export function CountriesTable({ countries }: CountriesTableProps) {
  const sorted = [...countries].sort((a, b) => b.roa_coverage_pct - a.roa_coverage_pct)

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">#</TableHead>
          <TableHead className="text-muted-foreground">Pays</TableHead>
          <TableHead className="text-center text-muted-foreground">ASN</TableHead>
          <TableHead className="text-center text-muted-foreground">Membres MANRS</TableHead>
          <TableHead className="text-muted-foreground">Couverture ROA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((c, i) => {
          const color = roaColorHex(c.roa_coverage_pct)
          return (
            <TableRow key={c.country_code} className="border-border hover:bg-secondary/50">
              <TableCell className="text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
              <TableCell>
                <Link
                  to={`/country/${c.country_code}`}
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  {c.country_name}
                </Link>
              </TableCell>
              <TableCell className="text-center font-mono">{c.total_asn}</TableCell>
              <TableCell className="text-center font-mono">{c.manrs_members}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[120px]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${c.roa_coverage_pct}%`, background: color }}
                    />
                  </div>
                  <span className="text-sm font-mono font-medium min-w-[3rem] text-right" style={{ color }}>
                    {c.roa_coverage_pct}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
