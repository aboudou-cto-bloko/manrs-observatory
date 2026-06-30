import { useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet"
import { roaColorHex } from "@/lib/countries"
import type { Country } from "@/types/api"
import "leaflet/dist/leaflet.css"

const COUNTRY_COORDS: Record<string, [number, number]> = {
  BJ: [9.31, 2.32],
  BF: [12.36, -1.52],
  CV: [15.12, -23.62],
  CI: [7.54, -5.55],
  GM: [13.44, -15.31],
  GH: [7.95, -1.02],
  GN: [9.95, -9.70],
  GW: [11.80, -15.18],
  LR: [6.43, -9.43],
  ML: [17.57, -4.00],
  MR: [21.01, -10.94],
  NE: [17.61, 8.08],
  NG: [9.08, 8.68],
  SN: [14.50, -14.45],
  SL: [8.46, -11.78],
  TG: [8.62, 1.21],
}

interface WestAfricaMapProps {
  countries: Country[]
}

export function WestAfricaMap({ countries }: WestAfricaMapProps) {
  const navigate = useNavigate()

  return (
    <div className="relative z-0">
      <MapContainer
        center={[11.5, -2.0]}
        zoom={5}
        className="h-[500px] w-full rounded-xl"
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {countries.map((c) => {
          const coords = COUNTRY_COORDS[c.country_code]
          if (!coords) return null

          const color = roaColorHex(c.roa_coverage_pct)
          const radius = Math.max(10, Math.min(30, 8 + c.total_asn / 4))

          return (
            <CircleMarker
              key={c.country_code}
              center={coords}
              radius={radius}
              pathOptions={{
                fillColor: color,
                color,
                fillOpacity: 0.6,
                weight: 2,
                opacity: 0.9,
              }}
              eventHandlers={{
                click: () => navigate(`/country/${c.country_code}`),
              }}
            >
              <Tooltip>
                <div className="text-sm">
                  <p className="font-bold">{c.country_name}</p>
                  <p className="opacity-70">{c.total_asn} ASN</p>
                  <p style={{ color }} className="font-mono font-bold">
                    ROA: {c.roa_coverage_pct}%
                  </p>
                </div>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
