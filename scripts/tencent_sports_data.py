#!/usr/bin/env python3
"""
Tencent Sports data acquisition via matchweb API.

Each league function returns a list of MatchData-compatible dictionaries.
Uses https://matchweb.sports.qq.com/matchUnion/list for live and upcoming matches.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "data" / "tencent_sources.json"
CACHE_DIR = ROOT / "data" / "cache"
OUTPUT_FILE = ROOT / "data" / "schedule.json"

MATCHWEB_BASE = "https://matchweb.sports.qq.com"

# columnId -> league name
COLUMN_LEAGUE = {
    "100000": "NBA",
    "100008": "CBA",
}

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
HEADERS = {
    "User-Agent": USER_AGENT,
    "Referer": "https://sports.qq.com/kbsweb/",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str) -> str:
    import re
    text = re.sub(r"[^\w\u4e00-\u9fff]+", "-", value.strip().lower(), flags=re.UNICODE)
    return text.strip("-") or "unknown"


# ---------------------------------------------------------------------------
# API fetch
# ---------------------------------------------------------------------------

def _fetch_matches(column_id: str, start: str, end: str) -> list[dict[str, Any]]:
    """Fetch raw matches from matchweb for a date range."""
    session = requests.Session()
    session.trust_env = False

    url = f"{MATCHWEB_BASE}/matchUnion/list"
    params = {
        "columnId": column_id,
        "startTime": start,
        "endTime": end,
        "limit": "200",
    }

    resp = session.get(url, params=params, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    session.close()

    if data.get("code") != 0:
        print(f"  API error for {column_id}: {data.get('msg', 'unknown')}")
        return []

    by_date = data.get("data", {})
    all_matches: list[dict[str, Any]] = []
    for matches in by_date.values():
        all_matches.extend(matches)
    return all_matches


# ---------------------------------------------------------------------------
# Field mapping
# ---------------------------------------------------------------------------

def _parse_datetime(raw: str) -> str:
    """Convert '2025-11-01 07:00:00' to ISO format."""
    try:
        dt = datetime.strptime(raw, "%Y-%m-%d %H:%M:%S")
        return dt.isoformat()
    except (ValueError, TypeError):
        return utc_now()


def _normalize_status(match_period: str) -> str:
    """Map matchPeriod to UPCOMING/LIVE/FINISHED."""
    mp = match_period or "0"
    if mp == "0":
        return "UPCOMING"
    if mp == "1":
        return "LIVE"
    return "FINISHED"


def _parse_score(raw: str | None) -> int | None:
    """Parse score string to int."""
    if not raw:
        return None
    try:
        return int(raw)
    except (ValueError, TypeError):
        return None


def _normalize_team(league: str, name: str, badge: str, index: int) -> dict[str, Any]:
    team_name = name.strip() or ("主队" if index == 1 else "客队")
    return {
        "id": slugify(f"{league}-{team_name}"),
        "name": team_name,
        "nameZh": team_name,
        "abbreviation": team_name[:3].upper(),
        "primaryColor": "#00f0ff" if index == 1 else "#ff0055",
        "secondaryColor": "#bc00dd" if index == 1 else "#f8ff00",
        "roster": [],
    }


def _adapt_match(raw: dict[str, Any], league: str, index: int) -> dict[str, Any]:
    """Convert a raw matchweb match to our MatchData schema."""
    left = raw.get("leftName", "")
    right = raw.get("rightName", "")
    starts_at = raw.get("startTime", "")
    mid = raw.get("mid", "")

    home = left
    away = right

    # Skip non-match entries (talk shows, news, etc.)
    if not home or not away or len(home) < 2 or len(away) < 2:
        return None
    # Skip entries where leftName = rightName (likely metadata, not a game)
    if home == away:
        return None
    home_score = _parse_score(raw.get("leftGoal"))
    away_score = _parse_score(raw.get("rightGoal"))

    source_token = hashlib.sha1(
        f"{league}-{home}-{away}-{index}-{starts_at}".encode("utf-8")
    ).hexdigest()[:10]

    return {
        "id": f"{league.lower()}-{slugify(home)}-{slugify(away)}-{source_token}",
        "league": league,
        "startsAt": _parse_datetime(starts_at),
        "venue": raw.get("matchDesc", "") or "Tencent Sports",
        "status": _normalize_status(raw.get("matchPeriod", "0")),
        "homeScore": home_score,
        "awayScore": away_score,
        "homeTeam": _normalize_team(league, home, raw.get("leftBadge", ""), 1),
        "awayTeam": _normalize_team(league, away, raw.get("rightBadge", ""), 2),
        "videoHighlightUrl": raw.get("webUrl", ""),
        "galleryUrl": raw.get("webUrl", ""),
        "broadcastProvider": "Tencent Sports",
        "sourceUrl": raw.get("webUrl", ""),
    }


# ---------------------------------------------------------------------------
# League fetch
# ---------------------------------------------------------------------------

def fetch_league_data(league: str, *, use_cache: bool = True) -> list[dict[str, Any]]:
    """Fetch matches for a league from matchweb API, with cache fallback."""
    # Find columnId from league name
    column_id = None
    for cid, name in COLUMN_LEAGUE.items():
        if name == league:
            column_id = cid
            break

    if not column_id:
        raise ValueError(f"Unknown league: {league}")

    # Fetch from ~1 year ago to 7 days ahead
    today = datetime.now()
    start = (today - timedelta(days=400)).strftime("%Y-%m-%d")
    end = (today + timedelta(days=7)).strftime("%Y-%m-%d")

    try:
        raw_matches = _fetch_matches(column_id, start, end)

        if not raw_matches:
            raise RuntimeError(f"No matches returned for {league}")

        matches = [_adapt_match(m, league, i) for i, m in enumerate(raw_matches)]
        # Deduplicate by id
        seen: set[str] = set()
        unique: list[dict[str, Any]] = []
        for m in matches:
            if m is None:
                continue
            if m["id"] not in seen:
                seen.add(m["id"])
                unique.append(m)

        # Write cache
        _write_cache(league, unique)
        return unique

    except Exception:
        if use_cache:
            cached = _load_cache(league)
            if cached:
                return cached
        raise


def _load_cache(league: str) -> list[dict[str, Any]]:
    cache_file = CACHE_DIR / f"{league.lower()}.json"
    if not cache_file.exists():
        return []
    with cache_file.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    return payload.get("matches", [])


def _write_cache(league: str, matches: list[dict[str, Any]]) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"{league.lower()}.json"
    cache_file.write_text(
        json.dumps(
            {"generatedAt": utc_now(), "league": league, "matches": matches},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


# ---------------------------------------------------------------------------
# Public API (compatible with legacy callers)
# ---------------------------------------------------------------------------

def get_nba_data(*args: Any, **kwargs: Any) -> list[dict[str, Any]]:
    return fetch_league_data("NBA", use_cache=kwargs.pop("use_cache", True))


def get_cba_data(*args: Any, **kwargs: Any) -> list[dict[str, Any]]:
    return fetch_league_data("CBA", use_cache=kwargs.pop("use_cache", True))


def get_team_china_data(*args: Any, **kwargs: Any) -> list[dict[str, Any]]:
    return fetch_league_data("CBA", use_cache=kwargs.pop("use_cache", True))


def get_all_data(*args: Any, **kwargs: Any) -> dict[str, Any]:
    """Aggregate all leagues into the schedule.json format."""
    errors: list[str] = []
    matches: list[dict[str, Any]] = []

    for league, getter in {
        "NBA": get_nba_data,
        "CBA": get_cba_data,
        "TEAM_CHINA": get_team_china_data,
    }.items():
        try:
            matches.extend(getter(*args, **kwargs))
        except Exception as exc:
            errors.append(f"{league}: {exc}")

    return {
        "generatedAt": utc_now(),
        "matches": sorted(matches, key=lambda m: m.get("startsAt", "")),
        "errors": errors,
    }


def write_schedule_json(output_file: Path | None = None) -> dict[str, Any]:
    target = output_file or OUTPUT_FILE
    payload = get_all_data()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return payload


if __name__ == "__main__":
    result = write_schedule_json()
    print(
        f"Wrote {len(result['matches'])} matches with {len(result.get('errors', []))} errors"
    )
    for err in result.get("errors", []):
        print(f"  {err}")
