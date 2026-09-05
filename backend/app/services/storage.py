"""
In-memory results store — an MVP decision, not an oversight.

No SQLite yet, even though it's the recommended stack. Trade-off:
results are lost on server restart. Fine for a live demo; swap this
module for SQLite later if you need persistence across restarts —
nothing in the API layer needs to change.
"""
from typing import Optional

_store: dict[str, dict] = {}


def save_result(analysis_id: str, result: dict) -> None:
    _store[analysis_id] = result


def get_result(analysis_id: str) -> Optional[dict]:
    return _store.get(analysis_id)


def list_results() -> list[dict]:
    return list(_store.values())

_features_store: dict[str, list[dict]] = {}


def save_features(analysis_id: str, features: list[dict]) -> None:
    _features_store[analysis_id] = features


def get_features(analysis_id: str) -> Optional[list[dict]]:
    return _features_store.get(analysis_id)