"""Serve the bundled Lovelace card so users need no manual resource entry."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

logger = logging.getLogger(__name__)

CARD_FILENAME = "eybond-inverter-card.js"
CARD_URL = f"/eybond_local/{CARD_FILENAME}"
_REGISTERED_KEY = "eybond_local_card_registered"


def _card_path() -> Path:
    return Path(__file__).parent / CARD_FILENAME


def _card_version(path: Path) -> str:
    """Content hash, so a changed card busts the browser cache on update."""

    return hashlib.sha1(path.read_bytes()).hexdigest()[:10]


async def async_register_card(hass: HomeAssistant) -> None:
    """Expose the card at CARD_URL and load it on every frontend page.

    Best effort: a failure here must never block the integration itself.
    """

    if hass.data.get(_REGISTERED_KEY):
        return
    try:
        from homeassistant.components.frontend import add_extra_js_url
        from homeassistant.components.http import StaticPathConfig

        path = _card_path()
        version = await hass.async_add_executor_job(_card_version, path)
        await hass.http.async_register_static_paths(
            [StaticPathConfig(CARD_URL, str(path), True)]
        )
        add_extra_js_url(hass, f"{CARD_URL}?v={version}")
    except Exception:  # noqa: BLE001 - card is optional UI sugar
        logger.warning("EyeBond inverter card could not be registered", exc_info=True)
        return
    hass.data[_REGISTERED_KEY] = True
    logger.debug("EyeBond inverter card served at %s?v=%s", CARD_URL, version)
