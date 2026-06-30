export const COUNTRY_NAMES: Record<string, string> = {
  BJ: "Bénin",
  BF: "Burkina Faso",
  CV: "Cap-Vert",
  CI: "Côte d'Ivoire",
  GM: "Gambie",
  GH: "Ghana",
  GN: "Guinée",
  GW: "Guinée-Bissau",
  LR: "Liberia",
  ML: "Mali",
  MR: "Mauritanie",
  NE: "Niger",
  NG: "Nigeria",
  SN: "Sénégal",
  SL: "Sierra Leone",
  TG: "Togo",
}

export function roaColor(pct: number): "destructive" | "warning" | "success" {
  if (pct < 25) return "destructive"
  if (pct <= 60) return "warning"
  return "success"
}

export function roaColorHex(pct: number): string {
  if (pct < 25) return "#ef4444"
  if (pct <= 60) return "#f59e0b"
  return "#22c55e"
}
