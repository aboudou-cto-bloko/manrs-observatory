import time
import logging

import requests

from .config import (
    MANRS_API_BASE,
    MANRS_API_KEY,
    RIPE_STAT_BASE,
    RPKI_VALIDATOR_BASE,
    API_DELAY_SECONDS,
)

logger = logging.getLogger(__name__)

session = requests.Session()
session.headers.update({"Accept": "application/json"})


def _get(url: str, headers: dict | None = None, timeout: int = 30) -> dict | None:
    time.sleep(API_DELAY_SECONDS)
    try:
        resp = session.get(url, headers=headers, timeout=timeout)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        logger.warning("Requête échouée %s : %s", url, e)
        return None


# ── MANRS Observatory v2 ──────────────────────────────────────────────


def fetch_manrs_asns_for_country(country_code: str) -> list[dict]:
    """Liste des ASN d'un pays via MANRS v2 (public, sans clé).
    Retourne les ASN avec leur nom et organisation."""
    results = []
    page_token = None

    while True:
        url = f"{MANRS_API_BASE}/ases?economies={country_code}"
        if page_token:
            url += f"&pageToken={page_token}"

        data = _get(url)
        if not data:
            break

        results.extend(data.get("ases", []))
        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return results


def fetch_manrs_participants() -> set[int]:
    """Récupère la liste des ASN membres MANRS (nécessite clé API).
    Retourne un set d'ASN numbers."""
    if not MANRS_API_KEY:
        logger.info("Pas de clé API MANRS — statut membre non disponible")
        return set()

    headers = {"Authorization": f"Bearer {MANRS_API_KEY}"}
    members = set()
    page_token = None

    while True:
        url = f"{MANRS_API_BASE}/participants"
        if page_token:
            url += f"?pageToken={page_token}"

        data = _get(url, headers=headers)
        if not data:
            break

        for p in data.get("participants", []):
            for asn in p.get("asns", []):
                members.add(asn)

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    logger.info("  %d ASN membres MANRS chargés", len(members))
    return members


def fetch_manrs_scores(asn_number: int) -> dict | None:
    """Récupère les scores détaillés d'un ASN membre MANRS.
    Retourne None si non autorisé (ASN non membre)."""
    if not MANRS_API_KEY:
        return None

    headers = {"Authorization": f"Bearer {MANRS_API_KEY}"}
    url = f"{MANRS_API_BASE}/scores/details?asn={asn_number}"
    return _get(url, headers=headers)


# ── PeeringDB (Coordination + Filtering) ────────────────────────────


def fetch_peeringdb_info(asn_number: int) -> dict:
    """Vérifie la présence PeeringDB et les données IRR d'un ASN.
    Permet d'estimer coordination et filtering."""
    url = f"https://www.peeringdb.com/api/net?asn={asn_number}"
    data = _get(url)

    result = {
        "on_peeringdb": False,
        "has_irr": False,
        "has_policy": False,
    }

    if not data:
        return result

    nets = data.get("data", [])
    if not nets:
        return result

    net = nets[0]
    result["on_peeringdb"] = True
    result["has_irr"] = bool(net.get("irr_as_set", "").strip())
    result["has_policy"] = net.get("policy_general", "") not in ("", "Not Disclosed")

    return result


def fetch_abuse_contact(asn_number: int) -> bool:
    """Vérifie si l'ASN a un contact abuse enregistré auprès du RIR."""
    url = f"{RIPE_STAT_BASE}/abuse-contact-finder/data.json?resource=AS{asn_number}"
    data = _get(url)
    if not data:
        return False

    contacts = data.get("data", {}).get("abuse_contacts", [])
    rir_email = data.get("data", {}).get("authoritative_rir_abuse_contact_email", "")
    return bool(contacts) or bool(rir_email)


# ── CAIDA Spoofer (Anti-spoofing) ────────────────────────────────────

_spoofer_cache: dict[int, float] | None = None


def _load_spoofer_data() -> dict[int, float]:
    """Scrape la page CAIDA Spoofer pour obtenir le % de blocking par ASN."""
    global _spoofer_cache
    if _spoofer_cache is not None:
        return _spoofer_cache

    import re
    logger.info("Chargement des données CAIDA Spoofer…")
    try:
        resp = session.get(
            "https://spoofer.caida.org/as_stats.php",
            headers={"User-Agent": "MANRS-Observatory/1.0"},
            timeout=30,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.warning("Impossible de charger Spoofer : %s", e)
        _spoofer_cache = {}
        return _spoofer_cache

    results: dict[int, float] = {}
    for match in re.finditer(r">(\d+)\s*\(", resp.text):
        asn = int(match.group(1))
        rest = resp.text[match.end():match.end() + 500]
        blocking_match = re.search(
            r"(\d+\.?\d*)\s*%\)\s*</td>\s*<td[^>]*>\s*\d+\s*\(\s*(\d+\.?\d*)\s*%",
            rest,
        )
        if not blocking_match:
            pct_matches = re.findall(r"(\d+\.?\d*)\s*%", rest[:300])
            if len(pct_matches) >= 2:
                results[asn] = float(pct_matches[1])
        else:
            results[asn] = float(blocking_match.group(2))

    _spoofer_cache = results
    logger.info("  %d ASN dans Spoofer", len(results))
    return results


def check_antispoofing(asn_number: int) -> bool | None:
    """Vérifie si l'ASN bloque le spoofing selon CAIDA Spoofer.
    Retourne True si >50% blocking, False si testé mais pas blocking, None si pas de données."""
    data = _load_spoofer_data()
    if asn_number not in data:
        return None
    return data[asn_number] > 50


# ── RIPE Stat ─────────────────────────────────────────────────────────


def fetch_announced_prefixes(asn_number: int) -> list[str]:
    """Récupère les préfixes annoncés par un ASN via RIPE Stat."""
    url = f"{RIPE_STAT_BASE}/announced-prefixes/data.json?resource=AS{asn_number}"
    data = _get(url)
    if not data:
        return []

    try:
        return [p["prefix"] for p in data["data"]["prefixes"]]
    except (KeyError, TypeError) as e:
        logger.warning("Parsing préfixes RIPE échoué pour AS%d : %s", asn_number, e)
        return []


# ── RPKI Validation ──────────────────────────────────────────────────


def validate_roa(asn_number: int, prefix: str) -> dict:
    """Valide le statut ROA d'un préfixe via le validateur RIPE NCC."""
    url = f"{RPKI_VALIDATOR_BASE}/validity/{asn_number}/{prefix}"
    data = _get(url)

    if not data:
        return {"prefix": prefix, "roa_status": "not-found", "roa_asn": None}

    try:
        validity = data["validated_route"]["validity"]
        state = validity.get("state", "not-found")

        roa_asn = None
        matched = validity.get("VRPs", {}).get("matched", [])
        if matched:
            asn_str = str(matched[0].get("asn", ""))
            roa_asn = int(asn_str.replace("AS", "")) if asn_str else None

        status_map = {"valid": "valid", "invalid": "invalid"}
        return {
            "prefix": prefix,
            "roa_status": status_map.get(state, "not-found"),
            "roa_asn": roa_asn,
        }
    except (KeyError, TypeError, ValueError) as e:
        logger.warning("Parsing ROA échoué pour %s : %s", prefix, e)
        return {"prefix": prefix, "roa_status": "not-found", "roa_asn": None}
