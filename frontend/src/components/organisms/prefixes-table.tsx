import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RoaBadge } from "@/components/atoms/roa-badge"
import type { Prefix } from "@/types/api"

interface PrefixesTableProps {
  prefixes: Prefix[]
}

export function PrefixesTable({ prefixes }: PrefixesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">Préfixe</TableHead>
          <TableHead className="text-center text-muted-foreground">Statut ROA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {prefixes.map((p) => (
          <TableRow key={p.prefix} className="border-border hover:bg-secondary/50">
            <TableCell className="font-mono text-sm text-foreground">{p.prefix}</TableCell>
            <TableCell className="text-center">
              <RoaBadge status={p.roa_status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
