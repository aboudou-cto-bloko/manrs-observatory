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
            ROUND(AVG(manrs_score)::numeric, 2) AS avg_manrs_score,
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
