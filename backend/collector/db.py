import psycopg2
import psycopg2.extras
import logging
from contextlib import contextmanager

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


def upsert_asn(conn, asn_data: dict):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO asn (asn_number, name, country_code, is_manrs_member,
                             manrs_score, action_filtering, action_antispoofing,
                             action_coordination, action_validation, last_updated)
            VALUES (%(asn_number)s, %(name)s, %(country_code)s, %(is_manrs_member)s,
                    %(manrs_score)s, %(action_filtering)s, %(action_antispoofing)s,
                    %(action_coordination)s, %(action_validation)s, NOW())
            ON CONFLICT (asn_number) DO UPDATE SET
                name = EXCLUDED.name,
                is_manrs_member = EXCLUDED.is_manrs_member,
                manrs_score = EXCLUDED.manrs_score,
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
                    COALESCE(AVG(manrs_score), 0) AS avg_score,
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
