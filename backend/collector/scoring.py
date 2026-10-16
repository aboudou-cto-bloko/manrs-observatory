ACTION_KEYS = ("filtering", "antispoofing", "coordination", "validation")


def compute_score(actions: dict) -> dict:
    """Calcule le score MANRS à partir des 4 actions.

    Une action valant None est « non évaluée » : elle ne compte ni dans les
    points obtenus ni dans le dénominateur, donc ne pénalise pas l'ASN.
    Le score normalisé ramène le résultat sur 4 pour rester comparable.
    """
    values = [actions[k] for k in ACTION_KEYS]
    evaluated = sum(v is not None for v in values)
    achieved = sum(v is True for v in values)
    normalized = round(achieved / evaluated * 4, 2) if evaluated else 0.0
    return {
        "manrs_score": achieved,
        "actions_evaluated": max(evaluated, 1),
        "manrs_score_normalized": normalized,
    }
