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
import type { AsnSummary } from "@/types/api"

interface AsnTableProps {
  asns: AsnSummary[]
}

export function AsnTable({ asns }: AsnTableProps) {
  const sorted = [...asns].sort((a, b) => b.roa_coverage_pct - a.roa_coverage_pct)

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">ASN</TableHead>
          <TableHead className="text-muted-foreground">Opérateur</TableHead>
          <TableHead className="text-center text-muted-foreground">MANRS</TableHead>
          <TableHead className="text-muted-foreground">Couverture ROA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((a) => {
          const color = roaColorHex(a.roa_coverage_pct)
          return (
            <TableRow key={a.asn_number} className="border-border hover:bg-secondary/50">
              <TableCell>
                <Link
                  to={`/asn/${a.asn_number}`}
                  className="font-mono font-medium text-primary hover:underline"
                >
                  AS{a.asn_number}
                </Link>
              </TableCell>
              <TableCell className="text-foreground">{a.name ?? "—"}</TableCell>
              <TableCell className="text-center">
                {a.is_manrs_member ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                    ✓ Membre
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[100px]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${a.roa_coverage_pct}%`, background: color }}
                    />
                  </div>
                  <span className="text-sm font-mono font-medium min-w-[3rem] text-right" style={{ color }}>
                    {a.roa_coverage_pct}%
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
