import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { roaColorHex } from "@/lib/countries"

interface RoaGaugeProps {
  percentage: number
}

export function RoaGauge({ percentage }: RoaGaugeProps) {
  const color = roaColorHex(percentage)
  const data = [
    { value: percentage },
    { value: 100 - percentage },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">Couverture ROA</h3>
      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                startAngle={90}
                endAngle={-270}
                innerRadius="70%"
                outerRadius="100%"
                dataKey="value"
                stroke="none"
              >
                <Cell fill={color} />
                <Cell fill="#252836" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>
              {percentage}%
            </span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span>Valid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span>Invalid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span>Not Found</span>
          </div>
        </div>
      </div>
    </div>
  )
}
