"""The bundled card is served and registered as a Lovelace resource by REAL HA.

Uses Home Assistant's genuine lovelace storage collection and HTTP stack; only
the card file content is varied to simulate an integration update.
"""

from __future__ import annotations

from unittest import mock

from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component

from custom_components.eybond_local import frontend
from custom_components.eybond_local.const import DOMAIN


def _own(resources) -> list[dict]:
    return [
        item
        for item in resources.async_items()
        if item["url"].split("?", 1)[0] == frontend.CARD_PATH
    ]


async def _setup(hass: HomeAssistant) -> None:
    assert await async_setup_component(hass, "lovelace", {})
    assert await async_setup_component(hass, DOMAIN, {})
    await hass.async_block_till_done()


async def test_card_served_with_etag_and_resource_created(
    hass: HomeAssistant, hass_client
) -> None:
    await _setup(hass)
    await frontend.async_ensure_card_resource(hass)

    resources = hass.data["lovelace"].resources
    await resources.async_get_info()
    own = _own(resources)
    assert len(own) == 1
    assert own[0]["type"] == "module"
    assert own[0]["url"] == frontend.card_url(hass)

    client = await hass_client()
    resp = await client.get(own[0]["url"])
    assert resp.status == 200
    assert resp.headers["Content-Type"].startswith("application/javascript")
    body = await resp.read()
    assert b"eybond-inverter-card" in body
    etag = resp.headers["ETag"]

    resp = await client.get(frontend.CARD_PATH, headers={"If-None-Match": etag})
    assert resp.status == 304

    resp = await client.get(frontend.VERSION_API_PATH)
    assert resp.status == 200
    assert (await resp.json())["version"] == frontend.card_url(hass).split("?v=")[1]


async def test_new_hash_updates_the_same_resource(hass: HomeAssistant) -> None:
    """A second start with a changed card keeps one entry with the new URL."""

    await _setup(hass)
    await frontend.async_ensure_card_resource(hass)
    resources = hass.data["lovelace"].resources
    first = _own(resources)[0]

    # Simulate the next start after an update: fresh per-start state, new file.
    state = hass.data[f"{DOMAIN}_card"]
    state.pop("resource_done")
    state["body"] = b"/* updated */"
    state["version"] = frontend.card_hash(state["body"])
    await frontend.async_ensure_card_resource(hass)

    own = _own(resources)
    assert len(own) == 1
    assert own[0]["id"] == first["id"]
    assert own[0]["url"] != first["url"]
    assert own[0]["url"] == frontend.card_url(hass)


async def test_yaml_resource_mode_falls_back_to_extra_module(hass: HomeAssistant) -> None:
    assert await async_setup_component(
        hass, "lovelace", {"lovelace": {"resource_mode": "yaml"}}
    )
    assert await async_setup_component(hass, DOMAIN, {})
    await hass.async_block_till_done()
    with mock.patch(
        "homeassistant.components.frontend.add_extra_js_url"
    ) as add_extra:
        await frontend.async_ensure_card_resource(hass)
    add_extra.assert_called_once_with(hass, frontend.card_url(hass))
