import unittest

from collector.scoring import compute_score


def actions(f, a, c, v):
    return {"filtering": f, "antispoofing": a, "coordination": c, "validation": v}


class ComputeScoreTest(unittest.TestCase):
    def test_all_evaluated(self):
        r = compute_score(actions(True, True, False, True))
        self.assertEqual(r, {"manrs_score": 3, "actions_evaluated": 4, "manrs_score_normalized": 3.0})

    def test_tested_and_failing_is_penalised(self):
        r = compute_score(actions(True, False, True, True))
        self.assertEqual(r["manrs_score"], 3)
        self.assertEqual(r["actions_evaluated"], 4)

    def test_untested_antispoofing_is_not_penalised(self):
        r = compute_score(actions(True, None, True, True))
        self.assertEqual(r["manrs_score"], 3)
        self.assertEqual(r["actions_evaluated"], 3)
        self.assertEqual(r["manrs_score_normalized"], 4.0)

    def test_untested_differs_from_non_compliant(self):
        untested = compute_score(actions(True, None, False, False))
        failing = compute_score(actions(True, False, False, False))
        self.assertGreater(untested["manrs_score_normalized"], failing["manrs_score_normalized"])

    def test_nothing_compliant(self):
        r = compute_score(actions(False, None, False, False))
        self.assertEqual(r["manrs_score"], 0)
        self.assertEqual(r["manrs_score_normalized"], 0.0)


if __name__ == "__main__":
    unittest.main()
