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
    action_antispoofing BOOLEAN DEFAULT FALSE,
    action_coordination BOOLEAN DEFAULT FALSE,
    action_validation BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT NOW()
);

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
