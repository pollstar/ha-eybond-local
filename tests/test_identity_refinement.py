"""A generic PI label refined by a more specific catalog entry is the same inverter."""

from types import SimpleNamespace
import unittest

from custom_components.eybond_local.runtime.hub.common import _inverter_identities_conflict


def _inv(model, *, serial="", rated=None, family="pi30", driver="pi30"):
    details = {} if rated is None else {"output_rating_active_power": rated}
    return SimpleNamespace(
        driver_key=driver, protocol_family=family, model_name=model,
        serial_number=serial, details=details,
    )


class IdentityRefinementTests(unittest.TestCase):
    def test_generic_label_with_same_rating_is_refinement(self):
        persisted = _inv("PI30 6200")
        live = _inv("PI30 VMII-NXPW5KW 6200", rated=6200)
        self.assertFalse(_inverter_identities_conflict(persisted, live))

    def test_generic_label_with_other_rating_still_conflicts(self):
        persisted = _inv("PI30 6200")
        live = _inv("PI30 VMII-NXPW5KW 6200", rated=5000)
        self.assertTrue(_inverter_identities_conflict(persisted, live))

    def test_specific_label_is_not_treated_as_generic(self):
        persisted = _inv("PI30 VMII-NXPW5KW")
        live = _inv("PI30 VMII-NXPW5KW 6200", rated=6200)
        self.assertTrue(_inverter_identities_conflict(persisted, live))

    def test_different_serials_still_conflict(self):
        persisted = _inv("PI30 6200", serial="A1")
        live = _inv("PI30 6200", serial="B2", rated=6200)
        self.assertTrue(_inverter_identities_conflict(persisted, live))


if __name__ == "__main__":
    unittest.main()
