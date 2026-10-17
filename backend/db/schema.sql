-- MANRS West Africa Observatory — Schéma de base de données
-- Version 1.0

-- Table principale des ASN
CREATE TABLE IF NOT EXISTS asn (
    id SERIAL PRIMARY KEY,
    asn_number INTEGER UNIQUE NOT NULL,
    name VARCHAR(255),
    country_code CHAR(2) NOT NULL,
    is_manrs_member BOOLEAN DEFAULT FALSE,
    manrs_score SMALLINT DEFAULT 0 CHECK (manrs_score BETWEEN 0 AND 4),
    action_filtering BOOLEAN DEFAULT FALSE,
    -- Ternaire : TRUE = testé et bloque, FALSE = testé et ne bloque pas, NULL = non testé
    action_antispoofing BOOLEAN DEFAULT NULL,
    action_coordination BOOLEAN DEFAULT FALSE,
    action_validation BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Migrations idempotentes (bases créées avant la version 1.1)
ALTER TABLE asn ALTER COLUMN action_antispoofing DROP DEFAULT;
ALTER TABLE asn ADD COLUMN IF NOT EXISTS actions_evaluated SMALLINT DEFAULT 4
    CHECK (actions_evaluated BETWEEN 1 AND 4);
-- Score ramené sur 4 : points obtenus / actions évaluées * 4
ALTER TABLE asn ADD COLUMN IF NOT EXISTS manrs_score_normalized DECIMAL(3,2) DEFAULT 0;
-- Reprise des lignes enregistrées par la version 1.0 : 4 actions évaluées, donc score normalisé = score
UPDATE asn SET manrs_score_normalized = manrs_score
WHERE manrs_score_normalized = 0 AND manrs_score > 0 AND actions_evaluated = 4;
-- Objets IRR route/route6 trouvés (RIPE, RADB, AFRINIC)
ALTER TABLE asn ADD COLUMN IF NOT EXISTS irr_route_objects INTEGER DEFAULT 0;
ALTER TABLE asn ADD COLUMN IF NOT EXISTS irr_sources VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_asn_country ON asn(country_code);
CREATE INDEX IF NOT EXISTS idx_asn_number ON asn(asn_number);

-- Préfixes IP par ASN
CREATE TABLE IF NOT EXISTS prefixes (
    id SERIAL PRIMARY KEY,
    asn_id INTEGER REFERENCES asn(id) ON DELETE CASCADE,
    prefix VARCHAR(50) NOT NULL,
    roa_status VARCHAR(20) CHECK (roa_status IN ('valid', 'invalid', 'not-found')),
    roa_asn INTEGER,
    last_checked TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prefixes_asn ON prefixes(asn_id);

-- Agrégats par pays
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    country_code CHAR(2) UNIQUE NOT NULL,
    country_name VARCHAR(100),
    total_asn INTEGER DEFAULT 0,
    manrs_members INTEGER DEFAULT 0,
    avg_manrs_score DECIMAL(3,2) DEFAULT 0,
    roa_coverage_pct DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Données initiales des 16 pays
INSERT INTO countries (country_code, country_name) VALUES
    ('BJ', 'Bénin'),
    ('BF', 'Burkina Faso'),
    ('CV', 'Cap-Vert'),
    ('CI', 'Côte d''Ivoire'),
    ('GM', 'Gambie'),
    ('GH', 'Ghana'),
    ('GN', 'Guinée'),
    ('GW', 'Guinée-Bissau'),
    ('LR', 'Liberia'),
    ('ML', 'Mali'),
    ('MR', 'Mauritanie'),
    ('NE', 'Niger'),
    ('NG', 'Nigeria'),
    ('SN', 'Sénégal'),
    ('SL', 'Sierra Leone'),
    ('TG', 'Togo')
ON CONFLICT (country_code) DO NOTHING;


-- ── Historique des collectes ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'completed', 'partial', 'failed')),
    countries_failed TEXT,
    total_asn INTEGER,
    manrs_members INTEGER,
    avg_manrs_score DECIMAL(3,2)
);

CREATE INDEX IF NOT EXISTS idx_collections_started ON collections(started_at DESC);

-- Résultats agrégés par pays pour chaque collecte
CREATE TABLE IF NOT EXISTS collection_country_stats (
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    country_code CHAR(2) NOT NULL,
    total_asn INTEGER NOT NULL,
    manrs_members INTEGER NOT NULL,
    avg_manrs_score DECIMAL(3,2) NOT NULL,   -- normalisé sur 4
    roa_coverage_pct DECIMAL(5,2) NOT NULL,
    filtering_count INTEGER NOT NULL,
    antispoofing_pass INTEGER NOT NULL,
    antispoofing_tested INTEGER NOT NULL,
    coordination_count INTEGER NOT NULL,
    validation_count INTEGER NOT NULL,
    PRIMARY KEY (collection_id, country_code)
);

-- Résultats par ASN pour chaque collecte
CREATE TABLE IF NOT EXISTS collection_asn_results (
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    asn_number INTEGER NOT NULL,
    country_code CHAR(2) NOT NULL,
    is_manrs_member BOOLEAN NOT NULL,
    action_filtering BOOLEAN,
    action_antispoofing BOOLEAN,
    action_coordination BOOLEAN,
    action_validation BOOLEAN,
    manrs_score SMALLINT NOT NULL,
    actions_evaluated SMALLINT NOT NULL,
    manrs_score_normalized DECIMAL(3,2) NOT NULL,
    roa_coverage_pct DECIMAL(5,2) NOT NULL,
    PRIMARY KEY (collection_id, asn_number)
);

CREATE INDEX IF NOT EXISTS idx_car_asn ON collection_asn_results(asn_number);
CREATE INDEX IF NOT EXISTS idx_car_country ON collection_asn_results(country_code);

-- Lien de l'historique vers l'ASN : un ASN qui a un historique ne peut pas être supprimé
-- (RESTRICT, contrairement aux préfixes supprimés en cascade). Ajouté de façon idempotente.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'collection_asn_results_asn_fkey'
    ) THEN
        ALTER TABLE collection_asn_results
            ADD CONSTRAINT collection_asn_results_asn_fkey
            FOREIGN KEY (asn_number) REFERENCES asn(asn_number) ON DELETE RESTRICT;
    END IF;
END $$;
