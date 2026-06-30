import logging
import time

import schedule

from .config import WEST_AFRICA_COUNTRIES, COLLECTION_INTERVAL_HOURS
from .apis import (
    fetch_manrs_asns_for_country,
    fetch_manrs_participants,
    fetch_announced_prefixes,
    validate_roa,
    fetch_peeringdb_info,
    fetch_abuse_contact,
    check_antispoofing,
)
from .db import get_connection, upsert_asn, upsert_prefixes, update_country_stats

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("collector_errors.log"),
    ],
)
logger = logging.getLogger(__name__)


def collect_asns_for_country(
    country_code: str, country_name: str, manrs_members: set[int]
):
    logger.info("Collecte %s (%s)…", country_name, country_code)

    asn_list = fetch_manrs_asns_for_country(country_code)
    if not asn_list:
        logger.warning("Aucun ASN trouvé pour %s", country_code)
        return

    logger.info("  %d ASN trouvés pour %s", len(asn_list), country_code)

    with get_connection() as conn:
        for entry in asn_list:
            asn_number = entry["id"]
            try:
                is_member = asn_number in manrs_members

                prefixes_raw = fetch_announced_prefixes(asn_number)

                prefix_results = []
                for prefix in prefixes_raw:
                    roa = validate_roa(asn_number, prefix)
                    prefix_results.append(roa)

                valid_count = sum(
                    1 for p in prefix_results if p["roa_status"] == "valid"
                )
                roa_pct = (
                    (valid_count / len(prefix_results) * 100)
                    if prefix_results
                    else 0
                )
                has_validation = roa_pct > 50

                pdb = fetch_peeringdb_info(asn_number)
                has_abuse = fetch_abuse_contact(asn_number)

                has_filtering = pdb["has_irr"]
                has_coordination = pdb["on_peeringdb"]
                spoofer_result = check_antispoofing(asn_number)
                has_antispoofing = spoofer_result is True

                asn_data = {
                    "asn_number": asn_number,
                    "name": entry.get("name"),
                    "country_code": country_code,
                    "is_manrs_member": is_member,
                    "manrs_score": 0,
                    "action_filtering": has_filtering,
                    "action_antispoofing": has_antispoofing,
                    "action_coordination": has_coordination,
                    "action_validation": has_validation,
                }

                asn_data["manrs_score"] = sum([
                    asn_data["action_filtering"],
                    asn_data["action_antispoofing"],
                    asn_data["action_coordination"],
                    asn_data["action_validation"],
                ])

                asn_id = upsert_asn(conn, asn_data)
                upsert_prefixes(conn, asn_id, prefix_results)

                logger.info(
                    "  AS%d (%s) — membre:%s — %d préfixes — ROA:%.0f%%",
                    asn_number,
                    entry.get("name", "?"),
                    is_member,
                    len(prefix_results),
                    roa_pct,
                )

            except Exception:
                logger.exception("Erreur sur AS%d", asn_number)
                continue

        update_country_stats(conn, country_code)

    logger.info("Collecte %s terminée.", country_code)


def run_full_collection():
    logger.info("=== Début de la collecte complète ===")
    start = time.time()

    manrs_members = fetch_manrs_participants()

    for code, name in WEST_AFRICA_COUNTRIES.items():
        try:
            collect_asns_for_country(code, name, manrs_members)
        except Exception:
            logger.exception("Erreur collecte pays %s", code)
            continue
        time.sleep(1)

    elapsed = time.time() - start
    logger.info("=== Collecte terminée en %.1f minutes ===", elapsed / 60)


def main():
    logger.info("Démarrage du collecteur MANRS Observatory")
    logger.info("Intervalle de collecte : %dh", COLLECTION_INTERVAL_HOURS)

    run_full_collection()

    schedule.every(COLLECTION_INTERVAL_HOURS).hours.do(run_full_collection)

    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    main()
