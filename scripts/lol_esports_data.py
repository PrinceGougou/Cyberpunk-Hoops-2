#!/usr/bin/env python3
"""Acquire LPL, LCK and international LoL schedules from LoL Esports."""

from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "data" / "cache"
LOL_API_URL = "https://esports-api.lolesports.com/persisted/gw/getSchedule"
LOL_WEBSITE_URL = "https://lolesports.com/en-US/"
BILIBILI_LOL_LIVE_URL = "https://live.bilibili.com/lol"
DEFAULT_API_KEY = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z"
HISTORY_DAYS = 180
FUTURE_DAYS = 180

LOL_SOURCES = {
    "LOL_LPL": {"id": "98767991314006698", "slug": "lpl", "kind": "LOL_LPL"},
    "LOL_LCK": {"id": "98767991310872058", "slug": "lck", "kind": "LOL_LCK"},
    "LOL_WORLDS": {"id": "98767975604431411", "slug": "worlds", "kind": "LOL_INTL"},
    "LOL_MSI": {"id": "98767991325878492", "slug": "msi", "kind": "LOL_INTL"},
    "LOL_FIRST_STAND": {"id": "113464388705111224", "slug": "first_stand", "kind": "LOL_INTL"},
}

ACQUISITION_STATE: dict[str, dict[str, str]] = {}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    return text.strip("-") or hashlib.sha1(value.encode("utf-8")).hexdigest()[:10]


def _parse_time(value: str) -> datetime | None:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None


def _fetch_events(league_id: str) -> list[dict[str, Any]]:
    session = requests.Session()
    session.trust_env = False
    headers = {
        "x-api-key": os.environ.get("LOLESPORTS_API_KEY", DEFAULT_API_KEY),
        "Origin": "https://lolesports.com",
        "Referer": "https://lolesports.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
        "Accept": "application/json",
    }

    try:
        response = session.get(
            LOL_API_URL,
            params={"hl": "zh-CN", "leagueId": league_id},
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        schedule = payload.get("data", {}).get("schedule")
        if not isinstance(schedule, dict) or not isinstance(schedule.get("events"), list):
            raise RuntimeError("LoL Esports response did not contain a schedule")
        return schedule["events"]
    finally:
        session.close()


def _normalize_status(state: str) -> str:
    if state == "inProgress":
        return "LIVE"
    if state == "completed":
        return "FINISHED"
    return "UPCOMING"


def _normalize_team(raw: dict[str, Any], group: str, index: int) -> dict[str, Any]:
    name = str(raw.get("name") or raw.get("code") or ("Team A" if index == 1 else "Team B"))
    code = str(raw.get("code") or name[:4]).upper()
    return {
        "id": f"lol-{slugify(code or name)}",
        "name": name,
        "nameZh": name,
        "abbreviation": code,
        "primaryColor": "#00f0ff" if index == 1 else "#ff0055",
        "secondaryColor": "#bc00dd" if index == 1 else "#f8ff00",
        "group": group,
        "roster": [],
    }


def _score(team: dict[str, Any], status: str) -> int | None:
    if status == "UPCOMING":
        return None
    value = team.get("result", {}).get("gameWins")
    return int(value) if isinstance(value, (int, float)) else None


def _adapt_event(event: dict[str, Any], source: dict[str, str]) -> dict[str, Any] | None:
    if event.get("type") != "match":
        return None

    match = event.get("match") or {}
    teams = match.get("teams") or []
    starts_at = str(event.get("startTime") or "")
    if len(teams) != 2 or _parse_time(starts_at) is None:
        return None

    league = source["kind"]
    status = _normalize_status(str(event.get("state") or ""))
    league_info = event.get("league") or {}
    league_name = str(league_info.get("name") or source["slug"].upper())
    block_name = str(event.get("blockName") or "赛程")
    best_of = match.get("strategy", {}).get("count")
    format_label = f"BO{best_of}" if isinstance(best_of, int) and best_of > 0 else ""
    venue = " · ".join(item for item in [league_name, block_name, format_label] if item)
    source_url = f"{LOL_WEBSITE_URL}?leagues={source['slug']}"
    match_id = str(match.get("id") or hashlib.sha1(
        f"{source['slug']}-{starts_at}-{teams[0].get('code')}-{teams[1].get('code')}".encode("utf-8")
    ).hexdigest()[:12])

    return {
        "id": f"lol-{match_id}",
        "league": league,
        "startsAt": starts_at,
        "venue": venue,
        "status": status,
        "homeScore": _score(teams[0], status),
        "awayScore": _score(teams[1], status),
        "homeTeam": _normalize_team(teams[0], league, 1),
        "awayTeam": _normalize_team(teams[1], league, 2),
        "videoHighlightUrl": BILIBILI_LOL_LIVE_URL,
        "galleryUrl": "",
        "broadcastProvider": "LoL Esports (Riot Games)",
        "sourceUrl": source_url,
    }


def _inside_window(match: dict[str, Any]) -> bool:
    timestamp = _parse_time(str(match.get("startsAt") or ""))
    if timestamp is None:
        return False
    now = datetime.now(timezone.utc)
    return now - timedelta(days=HISTORY_DAYS) <= timestamp <= now + timedelta(days=FUTURE_DAYS)


def _cache_path(source_key: str) -> Path:
    return CACHE_DIR / f"{source_key.lower()}.json"


def _write_cache(source_key: str, matches: list[dict[str, Any]]) -> str:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = utc_now()
    _cache_path(source_key).write_text(
        json.dumps(
            {"generatedAt": generated_at, "source": source_key, "matches": matches},
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    return generated_at


def _load_cache(source_key: str) -> tuple[list[dict[str, Any]], str]:
    path = _cache_path(source_key)
    if not path.exists():
        return [], ""
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload.get("matches", []), payload.get("generatedAt", "")


def fetch_source(source_key: str, *, use_cache: bool = True) -> list[dict[str, Any]]:
    source = LOL_SOURCES[source_key]
    try:
        events = _fetch_events(source["id"])
        matches = [adapted for event in events if (adapted := _adapt_event(event, source))]
        matches = [match for match in matches if _inside_window(match)]
        unique = {match["id"]: match for match in matches}
        values = sorted(unique.values(), key=lambda match: match["startsAt"])
        updated_at = _write_cache(source_key, values)
        ACQUISITION_STATE[source_key] = {"mode": "live", "updatedAt": updated_at}
        return values
    except Exception as exc:
        if use_cache:
            cached, updated_at = _load_cache(source_key)
            if cached or updated_at:
                ACQUISITION_STATE[source_key] = {
                    "mode": "cache",
                    "updatedAt": updated_at,
                    "message": str(exc),
                }
                return cached
        ACQUISITION_STATE[source_key] = {"mode": "unavailable", "message": str(exc)}
        raise


def get_all_data(*, use_cache: bool = True) -> dict[str, Any]:
    ACQUISITION_STATE.clear()
    matches: list[dict[str, Any]] = []
    errors: list[str] = []

    for source_key in LOL_SOURCES:
        try:
            matches.extend(fetch_source(source_key, use_cache=use_cache))
        except Exception as exc:
            errors.append(f"{source_key}: {exc}")

    for source_key, state in ACQUISITION_STATE.items():
        if state.get("mode") == "cache":
            errors.append(
                f"{source_key}: 实时采集失败，使用 {state.get('updatedAt', '未知时间')} 的缓存"
            )

    unique = {match["id"]: match for match in matches}
    return {
        "matches": sorted(unique.values(), key=lambda match: match["startsAt"]),
        "acquisition": ACQUISITION_STATE.copy(),
        "errors": errors,
    }


if __name__ == "__main__":
    from schedule_pipeline import write_schedule_json

    result = write_schedule_json()
    print(f"Wrote {len(result['matches'])} combined matches")
