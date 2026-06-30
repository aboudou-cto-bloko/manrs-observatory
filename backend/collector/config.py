import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://manrs:changeme@localhost:5432/manrs_observatory",
)

MANRS_API_KEY = os.getenv("MANRS_API_KEY", "")

WEST_AFRICA_COUNTRIES = {
    "BJ": "Bénin",
    "BF": "Burkina Faso",
    "CV": "Cap-Vert",
    "CI": "Côte d'Ivoire",
    "GM": "Gambie",
    "GH": "Ghana",
    "GN": "Guinée",
    "GW": "Guinée-Bissau",
    "LR": "Liberia",
    "ML": "Mali",
    "MR": "Mauritanie",
    "NE": "Niger",
    "NG": "Nigeria",
    "SN": "Sénégal",
    "SL": "Sierra Leone",
    "TG": "Togo",
}

MANRS_API_BASE = "https://observatory.manrs.org/api/v2"
RIPE_STAT_BASE = "https://stat.ripe.net/data"
RPKI_VALIDATOR_BASE = "https://rpki-validator.ripe.net/api/v1"

API_DELAY_SECONDS = 0.5
COLLECTION_INTERVAL_HOURS = 6
