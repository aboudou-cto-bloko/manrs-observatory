# Journal de développement — MANRS West Africa Observatory

> Ce journal documente chaque étape du développement : décisions, difficultés, solutions, apprentissages. Il servira de base pour le rapport technique et la soutenance.

---

## 2026-06-24 — Séance 1 : Schéma SQL + Collecteur

### Objectifs de la séance
- Créer le schéma de base de données PostgreSQL
- Développer le collecteur de données (module principal)
- Tester les APIs externes

### Difficultés rencontrées

#### 1. API MANRS : migration v1 → v2

**Problème** : Le CDC référence l'API MANRS v1 (`/api/v1/participants/{asn}`). En réalité, l'API a migré vers la v2. L'ancienne URL retourne un `302 → /api/v2/docs`.

**Solution** : Exploration de l'API v2 via la doc OpenAPI (`/api/v2/docs.json`). Endpoints utilisés :
- `GET /api/v2/ases?economies=BJ` — liste des ASN d'un pays (public, sans clé)
- `GET /api/v2/ases/{asn}` — détail d'un ASN (public)
- `GET /api/v2/participants` — membres MANRS (**nécessite clé API**)
- `GET /api/v2/scores/*` — scores détaillés (**nécessite clé API**)

**Apprentissage** : Les APIs publiques évoluent — toujours vérifier la documentation actuelle avant de coder. La v2 est mieux structurée (pagination, filtres par économie, OpenAPI).

#### 2. API Cloudflare RPKI : endpoint introuvable

**Problème** : Le CDC indique `https://rpki.cloudflare.com/api/v1/asn/{asn}/prefixes`. Cet endpoint retourne un `404`.

**Solution** : Utilisation de deux sources alternatives :
- **RIPE Stat** `announced-prefixes` pour lister les préfixes annoncés par un ASN
- **RIPE NCC RPKI Validator** (`rpki-validator.ripe.net`) pour valider chaque préfixe individuellement

**Apprentissage** : Toujours avoir un plan B pour les sources de données. Le validateur RIPE NCC est fiable car maintenu par le RIR européen.

#### 3. API RIPE Stat country-asns : format inattendu

**Problème** : L'endpoint `country-asns` sans paramètre `lod` retourne uniquement des compteurs (registered/routed), pas la liste des ASN. Avec `lod=1`, les ASN sont retournés dans un format string à parser (`{AsnSingle(37090), AsnSingle(28683)}`).

**Solution** : Abandonné RIPE Stat pour la liste des ASN — on utilise directement MANRS v2 `/api/v2/ases?economies=XX` qui retourne les ASN avec leurs noms et organisations. Plus fiable et plus riche en métadonnées.

**Apprentissage** : L'API MANRS v2 est finalement la meilleure source unique : elle donne les ASN, les noms, le pays. RIPE Stat reste utile pour les préfixes annoncés.

#### 4. Scores MANRS détaillés : accès restreint

**Problème** : Les endpoints de scores (`/api/v2/scores/conformance`, `/api/v2/scores/details`) nécessitent une clé API. Les 4 actions MANRS (filtering, anti-spoofing, coordination, validation) ne sont pas accessibles publiquement.

**Solution provisoire** :
- `action_validation` est déduit de la couverture ROA (>50% → True)
- Les 3 autres actions restent à False sans clé API
- Le code est prêt à intégrer les scores détaillés si la clé est obtenue

**Action requise** : Demander une clé API MANRS Observatory au commanditaire.

### Décisions techniques

| Décision | Raison |
|----------|--------|
| Utiliser MANRS v2 comme source principale d'ASN | Plus fiable que RIPE Stat pour la liste, retourne noms + pays |
| Utiliser RIPE Stat pour les préfixes annoncés | Seule source publique gratuite qui liste les préfixes par ASN |
| Utiliser RIPE NCC RPKI Validator pour le statut ROA | Remplace Cloudflare RPKI (introuvable), résultat fiable |
| PostgreSQL via Docker | Pas de PostgreSQL installé localement, Docker simplifie |
| UPSERT (INSERT ON CONFLICT) | Permet de relancer le collecteur sans doublons |
| Schéma avec CHECK constraints | Garantit l'intégrité des données (score 0-4, statut ROA) |

### Ce qui fonctionne

- ✅ Schéma SQL avec 4 tables + index + données initiales des 16 pays
- ✅ Collecteur Python avec 3 modules (apis.py, db.py, main.py)
- ✅ Pipeline testé sur le Bénin : 16 ASN détectés, 3 collectés avec succès
- ✅ Statuts ROA validés (AS28683/SBIN a 4/5 préfixes avec ROA valid)
- ✅ Stats pays recalculées automatiquement
- ✅ Docker Compose avec healthcheck sur PostgreSQL

### Résultats du premier test (Bénin)

| ASN | Opérateur | Préfixes testés | ROA valid | Validation |
|-----|-----------|----------------|-----------|------------|
| AS28683 | SBIN (ex-Bénin Télécoms) | 5 | 4 (80%) | ✅ |
| AS37090 | ISOCEL SA | 5 | 0 (0%) | ❌ |
| AS37136 | ETISALAT BENIN (Moov) | 5 | 0 (0%) | ❌ |

**Observation** : Seul l'opérateur historique (SBIN) a une bonne couverture ROA. Les opérateurs privés n'ont pas encore déployé RPKI — confirme la pertinence de l'observatoire.

### Observation clé — Bénin (données complètes, 16 ASN)

| ASN | Opérateur | Préfixes | ROA valid (%) |
|-----|-----------|----------|---------------|
| AS28683 | SBIN (ex-Bénin Télécoms) | 54 | **93%** |
| AS37090 | ISOCEL SA | 13 | 0% |
| AS37136 | ETISALAT BENIN (Moov) | 11 | 0% |
| AS37292 | OTI Telecom | 16 | 0% |
| AS37424 | SPACETEL BENIN (MTN) | 21 | 0% |
| AS328098 | JENY SAS | 6 | 0% |
| ... | (8 autres ASN) | ... | 0% |

**Constat** : Seul l'opérateur historique (SBIN, infrastructure nationale) a déployé RPKI. Tous les opérateurs privés (MTN, Moov, ISOCEL, OTI) n'ont aucune couverture ROA. C'est un résultat significatif qui valide la pertinence de l'observatoire.

**Hypothèse** : SBIN gère l'infrastructure backbone nationale, ce qui implique une relation plus directe avec AFRINIC et les obligations de sécurité. Les opérateurs privés se concentrent sur le service client sans investir dans la sécurité du routage.

---

## 2026-06-24 — Module API FastAPI

### Ce qui a été implémenté

5 endpoints REST fonctionnels :

| Endpoint | Testé | Résultat |
|----------|-------|----------|
| `GET /api/stats` | ✅ | Stats globales (total ASN, % ROA) |
| `GET /api/countries` | ✅ | Liste 16 pays avec agrégats |
| `GET /api/countries/{code}` | ✅ | Détail pays + liste ASN |
| `GET /api/asn/{number}` | ✅ | Fiche complète conforme au format CDC |
| `GET /api/search?q={query}` | ✅ | Recherche par numéro ou nom |

### Choix techniques API

- **psycopg2 + RealDictCursor** : retourne directement des dicts Python, pas de mapping ORM nécessaire pour un MVP
- **CORS ouvert** (`allow_origins=["*"]`) : le frontend React tourne sur un port différent
- **Calcul ROA à la volée** : `roa_coverage_pct` calculé via `LATERAL JOIN` plutôt que stocké, pour toujours refléter les données actuelles
- **Pas d'ORM** : pour un projet de cette taille, les requêtes SQL directes sont plus lisibles et performantes

---

## 2026-06-24 — Module Frontend React

### Stack choisie (vs CDC)

Le CDC recommande `create-react-app`. Choix fait de passer à une stack moderne :

| CDC | Choix réel | Raison |
|-----|-----------|--------|
| create-react-app | **Vite + React 19 + TypeScript** | CRA est deprecated depuis 2023, Vite est le standard actuel |
| TailwindCSS brut | **shadcn/ui + Tailwind v4** | Composants UI prêts, cohérence visuelle, maintenabilité |
| JavaScript | **TypeScript strict** | Typage des réponses API, détection d'erreurs à la compilation |

**Justification pour le mémoire** : ces choix montrent une veille technologique active. CRA n'est plus maintenu (React recommande officiellement des frameworks comme Vite). shadcn/ui offre des composants accessibles et personnalisables sans dépendance externe runtime.

### Architecture Atomic Design

```
src/
├── types/          Interfaces TypeScript (contrats API)
├── lib/            Utilitaires (client API, helpers pays)
├── hooks/          Hooks React réutilisables (useFetch)
├── components/
│   ├── ui/         Composants shadcn (Button, Card, Table...)
│   ├── atoms/      Composants unitaires (StatValue, RoaBadge, ActionIcon)
│   ├── molecules/  Combinaisons d'atomes (StatsBanner, SearchBar, ManrsScoreCard)
│   ├── organisms/  Composants complexes (CountriesTable, WestAfricaMap, PrefixesTable)
│   └── layouts/    Structure de page (RootLayout)
└── pages/          Pages de l'application (5 pages)
```

**Pourquoi Atomic Design** : permet de justifier en soutenance une méthodologie de conception UI reconnue (Brad Frost, 2013). Chaque niveau a une responsabilité claire, ce qui facilite la maintenance et les tests.

### Difficulté : TypeScript 6 + shadcn/ui

**Problème** : TypeScript 6 (installé via Vite template) considère `baseUrl`/`paths` dans tsconfig comme deprecated. shadcn/ui requiert un alias `@/*` pour ses imports.

**Solution** : Ajout de `"ignoreDeprecations": "6.0"` dans tsconfig + déclaration des imports dans `package.json`. La migration complète vers les imports natifs Node.js sera possible quand shadcn/ui le supportera nativement.

### Pages implémentées

| Page | Route | Composants utilisés |
|------|-------|---------------------|
| HomePage | `/` | StatsBanner + WestAfricaMap + CountriesTable |
| CountryPage | `/country/:code` | StatValues + AsnTable |
| AsnDetailPage | `/asn/:number` | ManrsScoreCard + RoaGauge + PrefixesTable |
| SearchPage | `/search?q=` | Recherche dynamique + résultats cards |
| AboutPage | `/about` | Contenu éditorial MANRS/RPKI/sources |

### Observation : données de collecte partielle

Pendant le développement frontend, la collecte en arrière-plan a révélé :
- **Orange Côte d'Ivoire (AS29571)** : 1134 préfixes, **100% ROA** — meilleur déploiement RPKI de la sous-région
- **MTN Côte d'Ivoire (AS36974)** : 159 préfixes, **100% ROA**
- Contraste fort avec le Bénin où seul SBIN déploie RPKI

---

## 2026-06-24 — Clé API MANRS obtenue

### Procédure d'obtention

1. Inscription self-service via `POST /api/v2/auth/register` (gratuit)
2. Vérification email
3. Login → token temporaire
4. Création clé API via `POST /api/v2/keys`

**Difficulté** : le schéma de l'API est strict (`additionalProperties: false`). Les champs doivent être enveloppés dans un objet nommé (ex: `{"login": {"email": "...", "password": "..."}}`), pas à plat. Documentation insuffisante — il faut lire le schéma OpenAPI.

### Ce que la clé débloque

| Endpoint | Sans clé | Avec clé |
|----------|----------|----------|
| `GET /api/v2/ases` | ✅ Liste ASN + noms | ✅ |
| `GET /api/v2/participants` | ❌ 401 | ✅ Liste des membres MANRS |
| `GET /api/v2/scores?economies=BJ` | ❌ 401 | ✅ Mais vide si aucun membre dans le pays |
| `GET /api/v2/scores/details?asn=X` | ❌ 401 | ⚠️ 403 si l'ASN n'est pas le nôtre |

**Limitation** : les scores détaillés (4 actions) sont réservés aux opérateurs eux-mêmes. On ne peut pas obtenir filtering/anti-spoofing/coordination pour un ASN tiers. Seul `is_manrs_member` et `action_validation` (via RPKI) sont disponibles.

### Résultat clé

**11 ASN membres MANRS sur 477 en Afrique de l'Ouest (2.3%)**

| ASN | Pays (à vérifier après collecte) |
|-----|----------------------------------|
| AS29465, AS30985, AS37125, AS37282, AS37420, AS37577, AS37721 | — |
| AS328010, AS328259, AS328549, AS328825 | — |

---

## 2026-06-24 — Couverture complète des 4 actions MANRS

### Le problème initial

Le CDC présuppose que l'API MANRS fournit les 4 scores détaillés par ASN. En réalité :
- L'endpoint `/scores/details` retourne **403** pour les ASN dont on n'est pas l'opérateur
- Seul `is_manrs_member` est accessible via `/participants`

### La solution : agrégation multi-sources

Chaque action MANRS est évaluée par une source de données publique différente :

| Action | Source | Méthode | Fiabilité |
|--------|--------|---------|-----------|
| **Filtering** | PeeringDB API | L'ASN a un `irr_as_set` renseigné → il publie ses politiques de routage dans l'IRR | ⚠️ Approximation — présence IRR ≠ filtrage actif, mais c'est un prérequis |
| **Anti-spoofing** | CAIDA Spoofer (scraping) | Tests réels de spoofing. Si >50% des blocs IP testés bloquent le spoofing → True | ✅ Mesure réelle, mais couverture partielle (pas tous les ASN testés) |
| **Coordination** | PeeringDB API | L'ASN est présent sur PeeringDB → il maintient des informations de contact publiques | ✅ Bonne proxy — PeeringDB est le standard pour les contacts inter-opérateurs |
| **Validation** | RIPE NCC RPKI Validator | Couverture ROA >50% des préfixes → l'ASN a déployé RPKI | ✅ Mesure directe et fiable |

### Article ROSE-T (MANRS blog, mars 2024)

L'article sur ROSE-T confirme que la vérification des 4 actions MANRS est un problème ouvert :
- ROSE-T nécessite la **configuration du routeur** de l'opérateur → inutilisable à distance
- Il utilise **Batfish** pour parser les configs et **Kathará** pour émuler le réseau
- L'anti-spoofing est vérifié en envoyant des paquets avec Scapy dans l'émulation
- Notre approche (sources publiques externes) est complémentaire : moins précise mais applicable à tous les ASN sans leur coopération

**Argument pour le mémoire** : notre observatoire est le premier à combiner 5 APIs/sources publiques pour approximer les 4 actions MANRS sans nécessiter la coopération des opérateurs. C'est une contribution originale.

### Sources de données finales

| # | Source | Type | Authentification |
|---|--------|------|------------------|
| 1 | MANRS Observatory v2 | API REST | Clé API (gratuite) |
| 2 | RIPE Stat | API REST | Publique |
| 3 | RIPE NCC RPKI Validator | API REST | Publique |
| 4 | PeeringDB | API REST | Publique |
| 5 | CAIDA Spoofer | Scraping HTML | Publique |

### Prochaines étapes

- [ ] Attendre fin de la collecte complète (4 actions)
- [ ] Analyser les résultats et produire les constats
- [ ] Dockeriser le frontend
- [ ] Rédiger le mémoire
