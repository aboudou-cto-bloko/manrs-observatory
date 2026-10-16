import psycopg2
import psycopg2.extras
import logging
from contextlib import contextmanager

from pathlib import Path

from .config import DATABASE_URL

logger = logging.getLogger(__name__)


@contextmanager
def get_connection():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def ensure_schema():
    """Applique db/schema.sql (idempotent) pour migrer une base existante."""
    candidates = [
        Path(__file__).resolve().parent.parent / "db" / "schema.sql",
        Path("/app/db/schema.sql"),
    ]
    schema = next((c for c in candidates if c.exists()), None)
    if schema is None:
        logger.warning("schema.sql introuvable — migration ignorée")
        return
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(schema.read_text())


def upsert_asn(conn, asn_data: dict):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO asn (asn_number, name, country_code, is_manrs_member,
                             manrs_score, actions_evaluated, manrs_score_normalized,
                             action_filtering, action_antispoofing,
                             action_coordination, action_validation,
                             irr_route_objects, irr_sources, last_updated)
            VALUES (%(asn_number)s, %(name)s, %(country_code)s, %(is_manrs_member)s,
                    %(manrs_score)s, %(actions_evaluated)s, %(manrs_score_normalized)s,
                    %(action_filtering)s, %(action_antispoofing)s,
                    %(action_coordination)s, %(action_validation)s,
                    %(irr_route_objects)s, %(irr_sources)s, NOW())
            ON CONFLICT (asn_number) DO UPDATE SET
                name = EXCLUDED.name,
                is_manrs_member = EXCLUDED.is_manrs_member,
                manrs_score = EXCLUDED.manrs_score,
                actions_evaluated = EXCLUDED.actions_evaluated,
                manrs_score_normalized = EXCLUDED.manrs_score_normalized,
                irr_route_objects = EXCLUDED.irr_route_objects,
                irr_sources = EXCLUDED.irr_sources,
                action_filtering = EXCLUDED.action_filtering,
                action_antispoofing = EXCLUDED.action_antispoofing,
                action_coordination = EXCLUDED.action_coordination,
                action_validation = EXCLUDED.action_validation,
                last_updated = NOW()
            RETURNING id
            """,
            asn_data,
        )
        return cur.fetchone()[0]


def upsert_prefixes(conn, asn_id: int, prefixes: list[dict]):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM prefixes WHERE asn_id = %s", (asn_id,))

        if not prefixes:
            return

        values = [
            (asn_id, p["prefix"], p["roa_status"], p.get("roa_asn"))
            for p in prefixes
        ]
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO prefixes (asn_id, prefix, roa_status, roa_asn)
            VALUES %s
            """,
            values,
        )


def update_country_stats(conn, country_code: str):
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE countries SET
                total_asn = sub.total,
                manrs_members = sub.members,
                avg_manrs_score = sub.avg_score,
                roa_coverage_pct = sub.roa_pct,
                last_updated = NOW()
            FROM (
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE is_manrs_member) AS members,
                    COALESCE(AVG(manrs_score_normalized), 0) AS avg_score,
                    COALESCE(
                        100.0 * COUNT(*) FILTER (WHERE p.roa_valid > 0)
                        / NULLIF(COUNT(*) FILTER (WHERE p.total_prefixes > 0), 0),
                        0
                    ) AS roa_pct
                FROM asn a
                LEFT JOIN LATERAL (
                    SELECT
                        COUNT(*) AS total_prefixes,
                        COUNT(*) FILTER (WHERE roa_status = 'valid') AS roa_valid
                    FROM prefixes WHERE asn_id = a.id
                ) p ON TRUE
                WHERE a.country_code = %s
            ) sub
            WHERE countries.country_code = %s
            """,
            (country_code, country_code),
        )


# ── Historique des collectes ─────────────────────────────────────────


def start_collection(conn) -> int:
    with conn.cursor() as cur:
        cur.execute("INSERT INTO collections (status) VALUES ('running') RETURNING id")
        return cur.fetchone()[0]


def finish_collection(conn, collection_id: int, failed_countries: list[str]):
    """Fige l'état courant des tables asn/prefixes dans l'historique de la collecte."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO collection_asn_results (
                collection_id, asn_number, country_code, is_manrs_member,
                action_filtering, action_antispoofing, action_coordination,
                action_validation, manrs_score, actions_evaluated,
                manrs_score_normalized, roa_coverage_pct)
            SELECT %s, a.asn_number, a.country_code, a.is_manrs_member,
                   a.action_filtering, a.action_antispoofing, a.action_coordination,
                   a.action_validation, a.manrs_score, a.actions_evaluated,
                   a.manrs_score_normalized,
                   COALESCE(ROUND(100.0 * p.valid / NULLIF(p.total, 0), 2), 0)
            FROM asn a
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS total,
                       COUNT(*) FILTER (WHERE roa_status = 'valid') AS valid
                FROM prefixes WHERE asn_id = a.id
            ) p ON TRUE
            """,
            (collection_id,),
        )
        cur.execute(
            """
            INSERT INTO collection_country_stats (
                collection_id, country_code, total_asn, manrs_members,
                avg_manrs_score, roa_coverage_pct, filtering_count,
                antispoofing_pass, antispoofing_tested, coordination_count,
                validation_count)
            SELECT collection_id, country_code, COUNT(*),
                   COUNT(*) FILTER (WHERE is_manrs_member),
                   ROUND(AVG(manrs_score_normalized), 2),
                   ROUND(AVG(roa_coverage_pct), 2),
                   COUNT(*) FILTER (WHERE action_filtering),
                   COUNT(*) FILTER (WHERE action_antispoofing),
                   COUNT(*) FILTER (WHERE action_antispoofing IS NOT NULL),
                   COUNT(*) FILTER (WHERE action_coordination),
                   COUNT(*) FILTER (WHERE action_validation)
            FROM collection_asn_results
            WHERE collection_id = %s
            GROUP BY collection_id, country_code
            """,
            (collection_id,),
        )
        cur.execute(
            """
            UPDATE collections SET
                finished_at = NOW(),
                status = %s,
                countries_failed = %s,
                total_asn = sub.total,
                manrs_members = sub.members,
                avg_manrs_score = sub.avg_score
            FROM (
                SELECT COUNT(*) AS total,
                       COUNT(*) FILTER (WHERE is_manrs_member) AS members,
                       COALESCE(ROUND(AVG(manrs_score_normalized), 2), 0) AS avg_score
                FROM collection_asn_results WHERE collection_id = %s
            ) sub
            WHERE collections.id = %s
            """,
            (
                "partial" if failed_countries else "completed",
                ",".join(failed_countries) or None,
                collection_id,
                collection_id,
            ),
        )


def fail_collection(conn, collection_id: int):
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE collections SET status = 'failed', finished_at = NOW() WHERE id = %s",
            (collection_id,),
        )
