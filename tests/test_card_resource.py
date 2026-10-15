"""Bundled Lovelace card: resource planning, registration and serving."""

from __future__ import annotations

import asyncio
import importlib.util
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest import mock

_FRONTEND_DIR = (
    Path(__file__).resolve().parents[1] / "custom_components" / "eybond_local" / "frontend"
)
_PKG = "_eybond_card_frontend_under_test"


def _load_frontend():
    """Load frontend/ by path as its own package (no integration import chain)."""

    for name in list(sys.modules):
        if name == _PKG or name.startswith(_PKG + "."):
            del sys.modules[name]
    spec = importlib.util.spec_from_file_location(
        _PKG,
        _FRONTEND_DIR / "__init__.py",
        submodule_search_locations=[str(_FRONTEND_DIR)],
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules[_PKG] = module
    spec.loader.exec_module(module)
    return module


frontend = _load_frontend()
plan_mod = sys.modules[f"{_PKG}.resource_plan"]
plan_resource_update = plan_mod.plan_resource_update
plan_resource_removal = plan_mod.plan_resource_removal

URL = "/eybond_local_static/eybond-inverter-card.js?v=aaaa1111"
URL_NEW = "/eybond_local_static/eybond-inverter-card.js?v=bbbb2222"


def ha_modules(**leaves):
    """sys.modules patch with stand-in HA leaf modules (and parents if absent)."""

    patch = {}
    for parent in ("homeassistant", "homeassistant.components"):
        if parent not in sys.modules:
            pkg = types.ModuleType(parent)
            pkg.__path__ = []
            patch[parent] = pkg
    for name, module in leaves.items():
        patch[f"homeassistant.components.{name}"] = module
    return mock.patch.dict(sys.modules, patch)


def item(item_id, url, res_type="module"):
    return {"id": item_id, "type": res_type, "url": url}


class ResourcePlanTest(unittest.TestCase):
    def test_creates_when_missing(self):
        plan = plan_resource_update([item("x", "/hacsfiles/other-card.js")], URL)
        self.assertTrue(plan.create)
        self.assertIsNone(plan.update_id)
        self.assertEqual(plan.delete_ids, ())

    def test_noop_when_current(self):
        plan = plan_resource_update([item("1", URL)], URL)
        self.assertTrue(plan.is_noop)

    def test_new_hash_updates_existing_entry(self):
        plan = plan_resource_update([item("1", URL)], URL_NEW)
        self.assertFalse(plan.create)
        self.assertEqual(plan.update_id, "1")

    def test_takes_over_hand_made_entry_without_version(self):
        plan = plan_resource_update(
            [item("7", "/eybond_local_static/eybond-inverter-card.js")], URL
        )
        self.assertEqual(plan.update_id, "7")
        self.assertFalse(plan.create)

    def test_fixes_wrong_type(self):
        plan = plan_resource_update([item("1", URL, res_type="js")], URL)
        self.assertEqual(plan.update_id, "1")

    def test_deletes_duplicates_keeps_first(self):
        plan = plan_resource_update(
            [item("1", URL), item("2", URL_NEW), item("3", URL)], URL
        )
        self.assertIsNone(plan.update_id)
        self.assertEqual(plan.delete_ids, ("2", "3"))

    def test_reports_local_copy_without_touching_it(self):
        local = "/local/eybond-inverter-card.js?v=1"
        plan = plan_resource_update([item("9", local)], URL)
        self.assertTrue(plan.create)
        self.assertEqual(plan.foreign_urls, (local,))
        self.assertNotIn("9", plan.delete_ids)

    def test_removal_takes_only_own_entries(self):
        ids = plan_resource_removal(
            [
                item("1", URL),
                item("2", "/local/eybond-inverter-card.js"),
                item("3", "/hacsfiles/x.js"),
                item("4", "/eybond_local_static/eybond-inverter-card.js"),
            ],
            "/eybond_local_static/eybond-inverter-card.js",
        )
        self.assertEqual(ids, ("1", "4"))


class FakeResources:
    """Stand-in for the storage-mode lovelace ResourceStorageCollection."""

    def __init__(self, items=()):
        self.items = {i["id"]: dict(i) for i in items}
        self.loaded = False
        self._next = 100

    async def async_get_info(self):
        self.loaded = True
        return {"resources": len(self.items)}

    def async_items(self):
        assert self.loaded, "items read before async_get_info"
        return [dict(v) for v in self.items.values()]

    async def async_create_item(self, data):
        self._next += 1
        new_id = str(self._next)
        self.items[new_id] = {"id": new_id, "type": data["res_type"], "url": data["url"]}
        return self.items[new_id]

    async def async_update_item(self, item_id, data):
        self.items[item_id].update(type=data["res_type"], url=data["url"])

    async def async_delete_item(self, item_id):
        del self.items[item_id]


def fake_hass(mode="storage", resources=None, version="aaaa1111"):
    hass = types.SimpleNamespace()
    hass.data = {}
    if mode is not None:
        hass.data["lovelace"] = types.SimpleNamespace(resource_mode=mode, resources=resources)
    hass.data["eybond_local_card"] = {"version": version}
    return hass


def run(coro):
    return asyncio.run(coro)


class EnsureResourceTest(unittest.TestCase):
    def test_two_starts_with_different_hashes_keep_one_entry(self):
        res = FakeResources([item("5", "/hacsfiles/other.js")])
        run(frontend.async_ensure_card_resource(fake_hass(resources=res, version="aaaa1111")))
        run(frontend.async_ensure_card_resource(fake_hass(resources=res, version="bbbb2222")))
        own = [i for i in res.items.values() if "eybond_local_static" in i["url"]]
        self.assertEqual(len(own), 1)
        self.assertEqual(own[0]["url"], URL_NEW)
        self.assertEqual(own[0]["type"], "module")
        self.assertIn("5", res.items)

    def test_once_per_start(self):
        res = FakeResources()
        hass = fake_hass(resources=res)
        run(frontend.async_ensure_card_resource(hass))
        res.items.clear()
        run(frontend.async_ensure_card_resource(hass))  # second entry, same start
        self.assertEqual(res.items, {})

    def test_stale_manual_entry_and_local_copy(self):
        res = FakeResources(
            [
                item("1", "/eybond_local_static/eybond-inverter-card.js", res_type="js"),
                item("2", "/local/eybond-inverter-card.js"),
            ]
        )
        with self.assertLogs(frontend.logger, "WARNING") as logs:
            run(frontend.async_ensure_card_resource(fake_hass(resources=res)))
        self.assertEqual(res.items["1"], {"id": "1", "type": "module", "url": URL})
        self.assertIn("2", res.items)
        self.assertTrue(any("/local/eybond-inverter-card.js" in m for m in logs.output))

    def test_yaml_mode_uses_extra_js_url(self):
        calls = []
        fe = types.ModuleType("homeassistant.components.frontend")
        fe.add_extra_js_url = lambda hass, url: calls.append(url)
        with ha_modules(frontend=fe):
            hass = fake_hass(mode="yaml", resources=None)
            run(frontend.async_ensure_card_resource(hass))
            frontend._add_extra_js_url(hass, URL)  # same URL again: not added twice
        self.assertEqual(calls, [URL])

    def test_storage_failure_falls_back(self):
        calls = []
        fe = types.ModuleType("homeassistant.components.frontend")
        fe.add_extra_js_url = lambda hass, url: calls.append(url)
        res = FakeResources()

        async def boom():
            raise RuntimeError("storage broken")

        res.async_get_info = boom
        with ha_modules(frontend=fe):
            with self.assertLogs(frontend.logger, "WARNING"):
                run(frontend.async_ensure_card_resource(fake_hass(resources=res)))
        self.assertEqual(calls, [URL])

    def test_removal_deletes_only_own(self):
        res = FakeResources([item("1", URL), item("2", "/local/eybond-inverter-card.js")])
        run(frontend.async_remove_card_resource(fake_hass(resources=res)))
        self.assertEqual(list(res.items), ["2"])


class _FakeView:
    url = ""
    name = ""
    requires_auth = True

    def json(self, result, status_code=200, headers=None):
        from aiohttp import web

        return web.json_response(result, status=status_code, headers=headers)


class CardServingTest(unittest.TestCase):
    def test_serves_start_time_bytes_with_etag(self):
        try:
            import aiohttp  # noqa: F401
        except ImportError:
            self.skipTest("aiohttp not installed")
        http_mod = types.ModuleType("homeassistant.components.http")
        http_mod.HomeAssistantView = _FakeView
        with tempfile.TemporaryDirectory() as tmp:
            card = Path(tmp) / "card.js"
            card.write_bytes(b"console.log('v1');")
            views = []

            async def executor(func, *args):
                return func(*args)

            hass = types.SimpleNamespace(
                data={},
                async_add_executor_job=executor,
                http=types.SimpleNamespace(register_view=views.append),
            )
            with ha_modules(http=http_mod), \
                    mock.patch.object(frontend, "_card_file", return_value=card):
                run(frontend.async_setup_card(hass))
                run(frontend.async_setup_card(hass))  # idempotent
            self.assertEqual(len(views), 2)
            card_view, version_view = views
            expected = frontend.card_hash(b"console.log('v1');")
            self.assertEqual(frontend.card_url(hass), f"{frontend.CARD_PATH}?v={expected}")

            card.write_bytes(b"console.log('v2 replaced by HACS');")  # after start
            req = types.SimpleNamespace(headers={})
            resp = run(card_view.get(req))
            self.assertEqual(resp.body, b"console.log('v1');")
            self.assertEqual(resp.headers["ETag"], f'"{expected}"')
            self.assertEqual(resp.headers["Cache-Control"], "no-cache")

            resp = run(card_view.get(types.SimpleNamespace(headers={"If-None-Match": f'"{expected}"'})))
            self.assertEqual(resp.status, 304)

            resp = run(version_view.get(req))
            self.assertIn(expected.encode(), resp.body)
            self.assertEqual(resp.headers["Cache-Control"], "no-store")
            self.assertFalse(card_view.requires_auth)
            self.assertTrue(version_view.requires_auth)


if __name__ == "__main__":
    unittest.main()
