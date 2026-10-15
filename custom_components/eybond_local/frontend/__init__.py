"""Serve the bundled Lovelace card and keep its dashboard resource current.

* ``async_setup_card`` (domain setup) reads the card once, hashes it and
  serves exactly those bytes at ``CARD_PATH`` with an ETag. Serving the
  start-time snapshot keeps file and hash consistent even when HACS replaces
  the file before Home Assistant restarts.
* ``async_ensure_card_resource`` (once per start) keeps exactly one Lovelace
  resource ``CARD_PATH?v=<hash>`` in storage mode: created on first start,
  updated in place on a new hash, duplicates removed, a hand-made entry for
  the same path taken over. Other copies of the card (e.g. ``/local/``) are
  left alone and reported. In YAML resource mode, or if storage fails, the
  module is loaded on every frontend page via ``add_extra_js_url`` instead.
* ``/api/eybond_local/card_version`` lets open pages notice an update.
* Removing the integration's last config entry removes the resource.

Nothing here may block the integration: failures are logged and skipped.
This package imports Home Assistant lazily so it stays unit-testable.
"""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import TYPE_CHECKING, Any

from .resource_plan import RESOURCE_TYPE, plan_resource_removal, plan_resource_update

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

logger = logging.getLogger(__name__)

DOMAIN = "eybond_local"
CARD_FILENAME = "eybond-inverter-card.js"
CARD_PATH = f"/{DOMAIN}_static/{CARD_FILENAME}"
VERSION_API_PATH = f"/api/{DOMAIN}/card_version"
_DATA_KEY = f"{DOMAIN}_card"


def _card_file() -> Path:
    return Path(__file__).parent / CARD_FILENAME


def card_hash(body: bytes) -> str:
    """Short content hash used as the cache-busting resource version."""

    return hashlib.sha256(body).hexdigest()[:12]


def _state(hass: HomeAssistant) -> dict[str, Any]:
    return hass.data.setdefault(_DATA_KEY, {})


def card_url(hass: HomeAssistant) -> str:
    return f"{CARD_PATH}?v={_state(hass)['version']}"


def _build_views(state: dict[str, Any]) -> tuple[Any, Any]:
    from homeassistant.components.http import HomeAssistantView

    class CardView(HomeAssistantView):
        """The card snapshot taken at start, revalidated by ETag."""

        url = CARD_PATH
        name = f"{DOMAIN}:card"
        # Loaded as a <script type=module> before any auth token exists, like
        # every other frontend module; it is static, non-sensitive JS.
        requires_auth = False

        async def get(self, request):  # noqa: D102
            from aiohttp import web

            etag = f'"{state["version"]}"'
            headers = {"ETag": etag, "Cache-Control": "no-cache"}
            if request.headers.get("If-None-Match") == etag:
                return web.Response(status=304, headers=headers)
            return web.Response(
                body=state["body"],
                content_type="application/javascript",
                charset="utf-8",
                headers=headers,
            )

    class CardVersionView(HomeAssistantView):
        """The version this start serves, so open pages can detect updates."""

        url = VERSION_API_PATH
        name = f"api:{DOMAIN}:card_version"
        requires_auth = True

        async def get(self, request):  # noqa: D102
            return self.json(
                {"version": state["version"]}, headers={"Cache-Control": "no-store"}
            )

    return CardView(), CardVersionView()


async def async_setup_card(hass: HomeAssistant) -> None:
    """Snapshot, hash and serve the card (idempotent within one start)."""

    state = _state(hass)
    if state.get("views"):
        return
    try:
        body = await hass.async_add_executor_job(_card_file().read_bytes)
        state["body"] = body
        state["version"] = card_hash(body)
        for view in _build_views(state):
            hass.http.register_view(view)
        state["views"] = True
        logger.debug("EyeBond inverter card served at %s", card_url(hass))
    except Exception:  # noqa: BLE001 - the card is optional UI
        logger.warning("EyeBond inverter card could not be served", exc_info=True)


def _lovelace_resources(hass: HomeAssistant) -> tuple[str | None, Any]:
    """Return (resource_mode, collection) across Lovelace data layouts."""

    data = hass.data.get("lovelace")
    if data is None:
        return None, None
    if isinstance(data, dict):  # older Home Assistant releases
        return data.get("resource_mode", data.get("mode")), data.get("resources")
    mode = getattr(data, "resource_mode", None) or getattr(data, "mode", None)
    return mode, getattr(data, "resources", None)


def _add_extra_js_url(hass: HomeAssistant, url: str) -> None:
    """Load the module on every frontend page, at most once per URL."""

    added = _state(hass).setdefault("extra_js", set())
    if url in added:
        return
    from homeassistant.components.frontend import add_extra_js_url

    add_extra_js_url(hass, url)
    added.add(url)


async def _async_apply_plan(collection: Any, url: str) -> None:
    await collection.async_get_info()  # loads the collection from storage
    plan = plan_resource_update(collection.async_items(), url)
    for foreign in plan.foreign_urls:
        logger.warning(
            "Another copy of the EyeBond inverter card is registered as a "
            "dashboard resource (%s). The integration manages %s itself; "
            "remove the old copy to avoid loading a stale card",
            foreign,
            url,
        )
    for item_id in plan.delete_ids:
        await collection.async_delete_item(item_id)
    if plan.update_id is not None:
        await collection.async_update_item(
            plan.update_id, {"res_type": RESOURCE_TYPE, "url": url}
        )
    elif plan.create:
        await collection.async_create_item({"res_type": RESOURCE_TYPE, "url": url})
    if not plan.is_noop:
        logger.info("EyeBond inverter card dashboard resource set to %s", url)


async def async_ensure_card_resource(hass: HomeAssistant) -> None:
    """Keep the dashboard resource on the current hash (once per start)."""

    state = _state(hass)
    if state.get("resource_done") or not state.get("version"):
        return
    state["resource_done"] = True
    url = card_url(hass)
    mode, collection = _lovelace_resources(hass)
    if mode == "storage" and collection is not None:
        try:
            await _async_apply_plan(collection, url)
            return
        except Exception:  # noqa: BLE001
            logger.warning(
                "Could not update the dashboard resource for the EyeBond "
                "inverter card; loading it globally instead",
                exc_info=True,
            )
    try:
        _add_extra_js_url(hass, url)
    except Exception:  # noqa: BLE001
        logger.warning("EyeBond inverter card could not be loaded", exc_info=True)


async def async_remove_card_resource(hass: HomeAssistant) -> None:
    """Delete our own dashboard resource entries (storage mode only)."""

    mode, collection = _lovelace_resources(hass)
    if mode != "storage" or collection is None:
        return
    try:
        await collection.async_get_info()
        for item_id in plan_resource_removal(collection.async_items(), CARD_PATH):
            await collection.async_delete_item(item_id)
    except Exception:  # noqa: BLE001
        logger.warning("Could not remove the EyeBond inverter card resource", exc_info=True)


async def async_remove_card_resource_if_last(
    hass: HomeAssistant, *, excluding_entry_id: str
) -> None:
    """Remove the resource when no other config entry of the domain remains."""

    remaining = [
        entry
        for entry in hass.config_entries.async_entries(DOMAIN)
        if entry.entry_id != excluding_entry_id
    ]
    if not remaining:
        await async_remove_card_resource(hass)


__all__ = [
    "CARD_PATH",
    "VERSION_API_PATH",
    "async_ensure_card_resource",
    "async_remove_card_resource",
    "async_remove_card_resource_if_last",
    "async_setup_card",
    "card_hash",
    "card_url",
]
