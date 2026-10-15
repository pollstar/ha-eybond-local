"""Pure planning of Lovelace resource changes for the bundled card.

No Home Assistant imports: the planner works on plain ``{id, type, url}``
mappings so it can be unit-tested anywhere.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from urllib.parse import urlsplit

RESOURCE_TYPE = "module"


@dataclass(frozen=True, slots=True)
class ResourcePlan:
    """What to change so exactly one current resource points at our card."""

    create: bool = False
    update_id: str | None = None
    delete_ids: tuple[str, ...] = ()
    # Same file name served from somewhere else (e.g. /local/...). Never
    # touched; reported so the user can remove a possibly stale copy.
    foreign_urls: tuple[str, ...] = field(default_factory=tuple)

    @property
    def is_noop(self) -> bool:
        return not self.create and self.update_id is None and not self.delete_ids


def _path(url: object) -> str:
    return urlsplit(str(url or "")).path


def _file_name(path: str) -> str:
    return path.rsplit("/", 1)[-1]


def plan_resource_update(
    items: Iterable[Mapping[str, object]], url: str
) -> ResourcePlan:
    """Plan create/update/delete so one ``module`` resource equals ``url``.

    Entries whose URL path equals ours (with any or no ``?v=``) are ours: the
    first is kept and corrected, duplicates are deleted.
    """

    own_path = _path(url)
    own_name = _file_name(own_path)
    own: list[Mapping[str, object]] = []
    foreign: list[str] = []
    for item in items:
        item_url = str(item.get("url") or "")
        item_path = _path(item_url)
        if item_path == own_path:
            own.append(item)
        elif own_name and _file_name(item_path) == own_name:
            foreign.append(item_url)

    if not own:
        return ResourcePlan(create=True, foreign_urls=tuple(foreign))

    keep, *duplicates = own
    needs_update = (
        str(keep.get("url") or "") != url
        or str(keep.get("type") or "") != RESOURCE_TYPE
    )
    return ResourcePlan(
        update_id=str(keep.get("id")) if needs_update else None,
        delete_ids=tuple(str(item.get("id")) for item in duplicates),
        foreign_urls=tuple(foreign),
    )


def plan_resource_removal(
    items: Iterable[Mapping[str, object]], url: str
) -> tuple[str, ...]:
    """Return ids of our own resources (path match only)."""

    own_path = _path(url)
    return tuple(
        str(item.get("id"))
        for item in items
        if _path(item.get("url")) == own_path
    )


__all__ = [
    "RESOURCE_TYPE",
    "ResourcePlan",
    "plan_resource_removal",
    "plan_resource_update",
]
