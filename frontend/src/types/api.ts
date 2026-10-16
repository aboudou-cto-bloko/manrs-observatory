export interface Country {
  country_code: string
  country_name: string
  total_asn: number
  manrs_members: number
  avg_manrs_score: number
  roa_coverage_pct: number
  last_updated: string
}

export interface CountryDetail extends Country {
  asns: AsnSummary[]
}

export interface AsnSummary {
  asn_number: number
  name: string | null
  country_code: string
  is_manrs_member: boolean
  manrs_score: number
  actions_evaluated: number
  manrs_score_normalized: number
  action_filtering: boolean
  /** true = testé et bloque, false = testé et ne bloque pas, null = non testé */
  action_antispoofing: boolean | null
  action_coordination: boolean
  action_validation: boolean
  roa_coverage_pct: number
}

export interface Prefix {
  prefix: string
  roa_status: "valid" | "invalid" | "not-found"
}

export interface AsnDetail {
  asn_number: number
  name: string | null
  country_code: string
  is_manrs_member: boolean
  manrs_score: number
  actions_evaluated: number
  manrs_score_normalized: number
  irr: { route_objects: number; sources: string[] }
  actions: {
    filtering: boolean
    /** null = non testé (non évalué, ne pénalise pas le score) */
    anti_spoofing: boolean | null
    coordination: boolean
    validation: boolean
  }
  prefixes: Prefix[]
  roa_coverage_pct: number
  last_updated: string | null
}

export interface GlobalStats {
  total_asn: number
  manrs_members: number
  avg_manrs_score: number
  roa_coverage_pct: number
}

export interface SearchResult {
  asn_number: number
  name: string | null
  country_code: string
}
