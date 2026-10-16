import os
from contextlib import asynccontextmanager

import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://manrs:changeme@localhost:5432/manrs_observatory",
)


def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    try:
        yield conn
    finally:
        conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="MANRS West Africa Observatory",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _query(sql: str, params: tuple = ()) -> list[dict]:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


def _query_one(sql: str, params: tuple = ()) -> dict | None:
    rows = _query(sql, params)
    return rows[0] if rows else None


# ── GET /api/stats ────────────────────────────────────────────────────


@app.get("/api/stats")
def get_stats():
    row = _query_one("""
        SELECT
            COUNT(*) AS total_asn,
            COUNT(*) FILTER (WHERE is_manrs_member) AS manrs_members,
            ROUND(AVG(manrs_score_normalized)::numeric, 2) AS avg_manrs_score,
            COALESCE(ROUND(
                100.0 * SUM(p.valid) / NULLIF(SUM(p.total), 0), 2
            ), 0) AS roa_coverage_pct
        FROM asn a
        LEFT JOIN LATERAL (
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE roa_status = 'valid') AS valid
            FROM prefixes WHERE asn_id = a.id
        ) p ON TRUE
    """)
    return row


# ── GET /api/countries ────────────────────────────────────────────────


@app.get("/api/countries")
def list_countries():
    return _query("""
        SELECT country_code, country_name, total_asn, manrs_members,
               avg_manrs_score, roa_coverage_pct, last_updated
        FROM countries
        ORDER BY country_name
    """)


# ── GET /api/countries/{code} ─────────────────────────────────────────


@app.get("/api/countries/{code}")
def get_country(code: str):
    code = code.upper()
    country = _query_one(
        "SELECT * FROM countries WHERE country_code = %s", (code,)
    )
    if not country:
        raise HTTPException(404, f"Pays {code} introuvable")

    asns = _query("""
        SELECT a.asn_number, a.name, a.is_manrs_member, a.manrs_score,
               a.actions_evaluated, a.manrs_score_normalized,
               a.action_filtering, a.action_antispoofing,
               a.action_coordination, a.action_validation,
               COALESCE(ROUND(
                   100.0 * p.valid / NULLIF(p.total, 0), 2
               ), 0) AS roa_coverage_pct
        FROM asn a
        LEFT JOIN LATERAL (
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE roa_status = 'valid') AS valid
            FROM prefixes WHERE asn_id = a.id
        ) p ON TRUE
        WHERE a.country_code = %s
        ORDER BY a.asn_number
    """, (code,))

    return {**country, "asns": asns}


# ── GET /api/asn/{number} ────────────────────────────────────────────


@app.get("/api/asn/{number}")
def get_asn(number: int):
    asn = _query_one(
        "SELECT * FROM asn WHERE asn_number = %s", (number,)
    )
    if not asn:
        raise HTTPException(404, f"ASN {number} introuvable")

    prefixes = _query(
        "SELECT prefix, roa_status, roa_asn FROM prefixes WHERE asn_id = %s",
        (asn["id"],),
    )

    valid_count = sum(1 for p in prefixes if p["roa_status"] == "valid")
    total = len(prefixes)

    return {
        "asn_number": asn["asn_number"],
        "name": asn["name"],
        "country_code": asn["country_code"],
        "is_manrs_member": asn["is_manrs_member"],
        "manrs_score": asn["manrs_score"],
        "actions_evaluated": asn["actions_evaluated"],
        "manrs_score_normalized": asn["manrs_score_normalized"],
        "irr": {
            "route_objects": asn["irr_route_objects"],
            "sources": asn["irr_sources"].split(",") if asn["irr_sources"] else [],
        },
        # Chaque action vaut true, false, ou null (non évaluée)
        "actions": {
            "filtering": asn["action_filtering"],
            "anti_spoofing": asn["action_antispoofing"],
            "coordination": asn["action_coordination"],
            "validation": asn["action_validation"],
        },
        "prefixes": [
            {"prefix": p["prefix"], "roa_status": p["roa_status"]}
            for p in prefixes
        ],
        "roa_coverage_pct": round(valid_count / total * 100, 2) if total else 0,
        "last_updated": asn["last_updated"].isoformat() if asn["last_updated"] else None,
    }


# ── GET /api/search ──────────────────────────────────────────────────


@app.get("/api/search")
def search_asn(q: str = Query(..., min_length=1)):
    if q.isdigit():
        results = _query(
            "SELECT asn_number, name, country_code FROM asn WHERE asn_number = %s",
            (int(q),),
        )
    else:
        results = _query(
            "SELECT asn_number, name, country_code FROM asn WHERE LOWER(name) LIKE %s ORDER BY name LIMIT 20",
            (f"%{q.lower()}%",),
        )
    return results


# ── Historique des collectes ──────────────────────────────────────────


@app.get("/api/collections")
def list_collections(limit: int = Query(50, ge=1, le=500)):
    return _query("""
        SELECT id, started_at, finished_at, status, countries_failed,
               total_asn, manrs_members, avg_manrs_score
        FROM collections
        ORDER BY started_at DESC
        LIMIT %s
    """, (limit,))


@app.get("/api/collections/{collection_id}")
def get_collection(collection_id: int):
    collection = _query_one(
        "SELECT * FROM collections WHERE id = %s", (collection_id,)
    )
    if not collection:
        raise HTTPException(404, f"Collecte {collection_id} introuvable")

    countries = _query("""
        SELECT * FROM collection_country_stats
        WHERE collection_id = %s ORDER BY country_code
    """, (collection_id,))
    return {**collection, "countries": countries}


@app.get("/api/collections/{collection_id}/asn")
def get_collection_asns(collection_id: int, country: str | None = None):
    sql = "SELECT * FROM collection_asn_results WHERE collection_id = %s"
    params: tuple = (collection_id,)
    if country:
        sql += " AND country_code = %s"
        params += (country.upper(),)
    return _query(sql + " ORDER BY asn_number", params)


@app.get("/api/countries/{code}/history")
def get_country_history(code: str):
    return _query("""
        SELECT c.id AS collection_id, c.started_at, c.status, s.total_asn,
               s.manrs_members, s.avg_manrs_score, s.roa_coverage_pct,
               s.filtering_count, s.antispoofing_pass, s.antispoofing_tested,
               s.coordination_count, s.validation_count
        FROM collection_country_stats s
        JOIN collections c ON c.id = s.collection_id
        WHERE s.country_code = %s
        ORDER BY c.started_at
    """, (code.upper(),))


@app.get("/api/asn/{number}/history")
def get_asn_history(number: int):
    return _query("""
        SELECT c.id AS collection_id, c.started_at, r.is_manrs_member,
               r.action_filtering, r.action_antispoofing,
               r.action_coordination, r.action_validation,
               r.manrs_score, r.actions_evaluated, r.manrs_score_normalized,
               r.roa_coverage_pct
        FROM collection_asn_results r
        JOIN collections c ON c.id = r.collection_id
        WHERE r.asn_number = %s
        ORDER BY c.started_at
    """, (number,))
