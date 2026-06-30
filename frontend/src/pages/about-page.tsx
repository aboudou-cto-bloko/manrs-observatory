import { Link } from "react-router-dom"
import { ArrowLeft, ShieldCheck, LockKey, ArrowSquareOut } from "@phosphor-icons/react"

export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-1">
          A propos de l'Observatoire
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <ShieldCheck size={28} weight="duotone" className="text-primary mb-3" />
          <h2 className="text-lg font-semibold mb-2">MANRS</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mutually Agreed Norms for Routing Security — 4 actions concrètes pour sécuriser le routage Internet, portées par l'Internet Society.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><span className="text-primary font-mono text-xs">01</span> Filtering</li>
            <li className="flex items-center gap-2"><span className="text-primary font-mono text-xs">02</span> Anti-spoofing</li>
            <li className="flex items-center gap-2"><span className="text-primary font-mono text-xs">03</span> Coordination</li>
            <li className="flex items-center gap-2"><span className="text-primary font-mono text-xs">04</span> Validation</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <LockKey size={28} weight="duotone" className="text-green-400 mb-3" />
          <h2 className="text-lg font-semibold mb-2">RPKI / ROA</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Infrastructure à clé publique qui prouve qu'un opérateur est autorisé à annoncer un préfixe IP. La couverture ROA est l'indicateur principal de cet observatoire.
          </p>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Valid — ROA existe et correspond</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Invalid — ROA ne correspond pas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Not Found — pas de ROA</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Sources de données</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { name: "MANRS Observatory", url: "https://observatory.manrs.org", desc: "ASN et participants" },
            { name: "RIPE Stat", url: "https://stat.ripe.net", desc: "Préfixes annoncés" },
            { name: "RIPE NCC RPKI Validator", url: "https://rpki-validator.ripe.net", desc: "Validation ROA" },
            { name: "PeeringDB", url: "https://www.peeringdb.com", desc: "Coordination et IRR" },
            { name: "CAIDA Spoofer", url: "https://spoofer.caida.org", desc: "Anti-spoofing" },
            { name: "AFRINIC", url: "https://www.afrinic.net", desc: "RIR Afrique" },
          ].map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/50 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <ArrowSquareOut size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-2">Ce projet</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Observatoire développé dans le cadre d'un projet de fin d'études à l'ENEAM
          (Université d'Abomey-Calavi, Bénin). Il couvre 16 pays d'Afrique de l'Ouest
          et met à jour ses données automatiquement toutes les 6 heures.
        </p>
      </div>
    </div>
  )
}
