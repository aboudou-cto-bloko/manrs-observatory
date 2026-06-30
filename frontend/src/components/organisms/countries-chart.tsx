import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { useNavigate } from "react-router-dom"
import { roaColorHex } from "@/lib/countries"
import type { Country } from "@/types/api"

interface CountriesChartProps {
  countries: Country[]
}

export function CountriesChart({ countries }: CountriesChartProps) {
  const navigate = useNavigate()
  const sorted = [...countries]
    .filter((c) => c.total_asn > 0)
    .sort((a, b) => b.roa_coverage_pct - a.roa_coverage_pct)

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2e3140" />
          <XAxis
            dataKey="country_code"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#2e3140" }}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#2e3140" }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1c25",
              border: "1px solid #2e3140",
              borderRadius: "8px",
              color: "#e4e4e7",
            }}
            formatter={(value) => [`${value}%`, "Couverture ROA"]}
            labelFormatter={(label) => {
              const c = countries.find((c) => c.country_code === String(label))
              return c?.country_name ?? String(label)
            }}
          />
          <Bar
            dataKey="roa_coverage_pct"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(_data, _index, e) => {
              const payload = (e as unknown as { payload?: Country })?.payload
              if (payload?.country_code) navigate(`/country/${payload.country_code}`)
            }}
          >
            {sorted.map((entry) => (
              <Cell
                key={entry.country_code}
                fill={roaColorHex(entry.roa_coverage_pct)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
