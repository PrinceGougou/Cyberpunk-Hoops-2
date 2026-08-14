#!/usr/bin/env python3
"""
Tencent Sports basketball data acquisition via matchweb API.

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
CACHE_DIR = ROOT / "data" / "cache"
OUTPUT_FILE = ROOT / "data" / "schedule.json"
ACQUISITION_STATE: dict[str, dict[str, str]] = {}

MATCHWEB_BASE = "https://matchweb.sports.qq.com"
HISTORY_DAYS = 120
FUTURE_DAYS = 45

# columnId -> league name
COLUMN_LEAGUE = {
    "100000": "NBA",
    "100008": "CBA",
}

NBA_EAST_TEAM_NAMES = {
    "凯尔特人", "篮网", "尼克斯", "76人", "猛龙",
    "公牛", "骑士", "活塞", "步行者", "雄鹿",
    "老鹰", "黄蜂", "热火", "魔术", "奇才",
}

NBA_WEST_TEAM_NAMES = {
    "掘金", "森林狼", "雷霆", "开拓者", "爵士",
    "勇士", "快船", "湖人", "太阳", "国王",
    "独行侠", "火箭", "灰熊", "鹈鹕", "马刺",
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
    """Convert Tencent's China Standard Time value to an offset-aware ISO string."""
    try:
        dt = datetime.strptime(raw, "%Y-%m-%d %H:%M:%S")
        china_timezone = timezone(timedelta(hours=8))
        return dt.replace(tzinfo=china_timezone).isoformat()
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


def _team_group(league: str, team_name: str) -> str:
    if league == "NBA":
        if team_name in NBA_EAST_TEAM_NAMES:
            return "NBA_EAST"
        if team_name in NBA_WEST_TEAM_NAMES:
            return "NBA_WEST"
        return "NBA_OTHER"
    return league


def _normalize_team(league: str, name: str, team_id: str, index: int) -> dict[str, Any]:
    team_name = name.strip() or ("主队" if index == 1 else "客队")
    return {
        "id": slugify(f"{league}-{team_id or team_name}"),
        "name": team_name,
        "nameZh": team_name,
        "abbreviation": team_name[:3].upper(),
        "primaryColor": "#00f0ff" if index == 1 else "#ff0055",
        "secondaryColor": "#bc00dd" if index == 1 else "#f8ff00",
        "group": _team_group(league, team_name),
        "roster": [],
    }


def _adapt_match(raw: dict[str, Any], league: str) -> dict[str, Any] | None:
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

    source_token = slugify(mid) if mid else hashlib.sha1(
        f"{league}-{home}-{away}-{starts_at}".encode("utf-8")
    ).hexdigest()[:10]

    status = _normalize_status(raw.get("matchPeriod", "0"))
    if status == "UPCOMING":
        home_score = None
        away_score = None

    return {
        "id": f"{league.lower()}-{source_token}",
        "league": league,
        "startsAt": _parse_datetime(starts_at),
        "venue": raw.get("matchDesc", "") or "Tencent Sports",
        "status": status,
        "homeScore": home_score,
        "awayScore": away_score,
        "homeTeam": _normalize_team(league, home, str(raw.get("leftId", "")), 1),
        "awayTeam": _normalize_team(league, away, str(raw.get("rightId", "")), 2),
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

    # A focused window keeps the deployable JSON small while preserving useful
    # recent results and enough confirmed future fixtures.
    today = datetime.now()
    start = (today - timedelta(days=HISTORY_DAYS)).strftime("%Y-%m-%d")
    end = (today + timedelta(days=FUTURE_DAYS)).strftime("%Y-%m-%d")

    try:
        raw_matches = _fetch_matches(column_id, start, end)

        if not raw_matches:
            raise RuntimeError(f"No matches returned for {league}")

        matches = [_adapt_match(match, league) for match in raw_matches]
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
        updated_at = _write_cache(league, unique)
        ACQUISITION_STATE[league] = {"mode": "live", "updatedAt": updated_at}
        return unique

    except Exception as exc:
        if use_cache:
            cached, updated_at = _load_cache(league)
            if cached:
                ACQUISITION_STATE[league] = {
                    "mode": "cache",
                    "updatedAt": updated_at,
                    "message": str(exc),
                }
                return cached
        ACQUISITION_STATE[league] = {"mode": "unavailable", "message": str(exc)}
        raise


def _load_cache(league: str) -> tuple[list[dict[str, Any]], str]:
    cache_file = CACHE_DIR / f"{league.lower()}.json"
    if not cache_file.exists():
        return [], ""
    with cache_file.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    return payload.get("matches", []), payload.get("generatedAt", "")


def _write_cache(league: str, matches: list[dict[str, Any]]) -> str:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"{league.lower()}.json"
    generated_at = utc_now()
    cache_file.write_text(
        json.dumps(
            {"generatedAt": generated_at, "league": league, "matches": matches},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return generated_at


# ---------------------------------------------------------------------------
# Public API (compatible with legacy callers)
# ---------------------------------------------------------------------------

def get_nba_data(*args: Any, **kwargs: Any) -> list[dict[str, Any]]:
    return fetch_league_data("NBA", use_cache=kwargs.pop("use_cache", True))


def get_cba_data(*args: Any, **kwargs: Any) -> list[dict[str, Any]]:
    return fetch_league_data("CBA", use_cache=kwargs.pop("use_cache", True))


def get_all_data(*args: Any, **kwargs: Any) -> dict[str, Any]:
    """Aggregate all leagues into the schedule.json format."""
    ACQUISITION_STATE.clear()
    errors: list[str] = []
    matches: list[dict[str, Any]] = []

    for league, getter in {
        "NBA": get_nba_data,
        "CBA": get_cba_data,
    }.items():
        try:
            matches.extend(getter(*args, **kwargs))
        except Exception as exc:
            errors.append(f"{league}: {exc}")

    unique_matches = {match["id"]: match for match in matches}
    for league, state in ACQUISITION_STATE.items():
        if state.get("mode") == "cache":
            errors.append(
                f"{league}: 实时采集失败，使用 {state.get('updatedAt', '未知时间')} 的缓存"
            )

    return {
        "generatedAt": utc_now(),
        "matches": sorted(unique_matches.values(), key=lambda m: m.get("startsAt", "")),
        "acquisition": ACQUISITION_STATE.copy(),
        "errors": errors,
    }


def write_schedule_json(output_file: Path | None = None) -> dict[str, Any]:
    """Compatibility entry point: write the full basketball + LoL schedule."""
    from schedule_pipeline import write_schedule_json as write_combined_schedule

    return write_combined_schedule(output_file)


if __name__ == "__main__":
    result = write_schedule_json()
    print(
        f"Wrote {len(result['matches'])} matches with {len(result.get('errors', []))} errors"
    )
    for err in result.get("errors", []):
        print(f"  {err}")
