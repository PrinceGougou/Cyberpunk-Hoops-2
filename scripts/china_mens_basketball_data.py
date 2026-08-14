#!/usr/bin/env python3
"""Acquire China men's national basketball games from cba.net.cn."""

from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import requests

ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "data" / "cache"
SOURCE_KEY = "CHINA_MEN_OFFICIAL"
OFFICIAL_HOME = "https://www.cba.net.cn/"
MEN_TEAM_PAGE = "https://www.cba.net.cn/gjdgjnl/index.jhtml"
EVENT_LIST_URL = "https://www.cba.net.cn/datahub/nationalteam/games/matchlist"
EVENT_SCHEDULE_URL = "https://www.cba.net.cn/datahub/nationalteam/games/teamSchedul"
HISTORY_DAYS = 180
FUTURE_DAYS = 180
CHINA_TIMEZONE = timezone(timedelta(hours=8))

ACQUISITION_STATE: dict[str, dict[str, str]] = {}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str) -> str:
    text = re.sub(r"[^\w\u4e00-\u9fff]+", "-", value.strip().lower(), flags=re.UNICODE)
    return text.strip("-") or "unknown"


def _request_json(url: str, params: dict[str, Any]) -> dict[str, Any]:
    session = requests.Session()
    session.trust_env = False
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
        "Referer": MEN_TEAM_PAGE,
        "Accept": "application/json, text/javascript, */*; q=0.01",
    }
    try:
        response = session.get(url, params=params, headers=headers, timeout=30)
        response.raise_for_status()
        payload = json.loads(response.content.decode("utf-8-sig"))
        if payload.get("status") != 0 or not isinstance(payload.get("data"), list):
            raise RuntimeError(payload.get("message") or "中国篮协官网接口返回异常")
        return payload
    finally:
        session.close()


def _parse_date(value: str) -> datetime | None:
    try:
        return datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=CHINA_TIMEZONE)
    except (TypeError, ValueError):
        return None


def _event_inside_window(event: dict[str, Any]) -> bool:
    start = _parse_date(str(event.get("matchTimeStart") or ""))
    end = _parse_date(str(event.get("matchTimeEnd") or "")) or start
    if start is None or end is None:
        return False
    now = datetime.now(CHINA_TIMEZONE)
    return end >= now - timedelta(days=HISTORY_DAYS) and start <= now + timedelta(days=FUTURE_DAYS)


def _parse_match_time(date: str, time: str) -> str | None:
    try:
        value = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
        return value.replace(tzinfo=CHINA_TIMEZONE).isoformat()
    except (TypeError, ValueError):
        return None


def _normalize_status(value: Any) -> str:
    state = str(value)
    if state == "1":
        return "LIVE"
    if state == "0":
        return "UPCOMING"
    return "FINISHED"


def _parse_score(value: Any) -> int | None:
    try:
        score = int(value)
        return score if score >= 0 else None
    except (TypeError, ValueError):
        return None


def _normalize_team(name: str, team_id: Any, index: int) -> dict[str, Any]:
    team_name = name.strip() or ("中国男篮" if index == 1 else "对手待定")
    return {
        "id": f"team-china-{slugify(str(team_id or team_name))}",
        "name": team_name,
        "nameZh": team_name,
        "abbreviation": team_name[:4].upper(),
        "primaryColor": "#00f0ff" if index == 1 else "#ff0055",
        "secondaryColor": "#bc00dd" if index == 1 else "#f8ff00",
        "group": "TEAM_CHINA",
        "roster": [],
    }


def _source_url(event: dict[str, Any]) -> str:
    query = urlencode({
        "matchId": event.get("matchId", ""),
        "seasonId": event.get("seasonId", ""),
        "competitionId": event.get("competitionId", ""),
        "teamId": event.get("teamId", ""),
        "type": 5,
    })
    return f"https://www.cba.net.cn/gjdscsg/index.jhtml?{query}"


def _adapt_game(raw: dict[str, Any], event: dict[str, Any]) -> dict[str, Any] | None:
    starts_at = _parse_match_time(str(raw.get("matchDate") or ""), str(raw.get("matchTime") or ""))
    home_name = str(raw.get("homeTeam") or "")
    away_name = str(raw.get("visitingTeam") or "")
    if starts_at is None or not home_name or not away_name:
        return None

    status = _normalize_status(raw.get("matchState"))
    source_url = _source_url(event)
    venue_parts = [
        str(event.get("matchPlace") or ""),
        str(raw.get("leagueGroup") or event.get("matchName") or ""),
        str(raw.get("matchStageName") or ""),
    ]
    venue = " · ".join(part for part in venue_parts if part)
    broadcast_url = str(raw.get("broadcastAddress") or "")

    return {
        "id": f"team-china-{raw.get('matchId')}",
        "league": "TEAM_CHINA",
        "startsAt": starts_at,
        "venue": venue or "中国男篮赛事",
        "status": status,
        "homeScore": None if status == "UPCOMING" else _parse_score(raw.get("homeTeamPoints")),
        "awayScore": None if status == "UPCOMING" else _parse_score(raw.get("visitingTeamPoints")),
        "homeTeam": _normalize_team(home_name, raw.get("homeTeamId"), 1),
        "awayTeam": _normalize_team(away_name, raw.get("visitingTeamId"), 2),
        "videoHighlightUrl": broadcast_url,
        "galleryUrl": "",
        "broadcastProvider": "中国篮球协会官网",
        "sourceUrl": source_url,
    }


def _cache_path() -> Path:
    return CACHE_DIR / "china_men_official.json"


def _write_cache(matches: list[dict[str, Any]]) -> str:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = utc_now()
    _cache_path().write_text(
        json.dumps(
            {"generatedAt": generated_at, "source": SOURCE_KEY, "matches": matches},
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    return generated_at


def _load_cache() -> tuple[list[dict[str, Any]], str]:
    path = _cache_path()
    if not path.exists():
        return [], ""
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload.get("matches", []), payload.get("generatedAt", "")


def fetch_china_men_data(*, use_cache: bool = True) -> list[dict[str, Any]]:
    try:
        events = _request_json(EVENT_LIST_URL, {"teamId": 1})["data"]
        relevant_events = [event for event in events if _event_inside_window(event)]
        matches: list[dict[str, Any]] = []

        for event in relevant_events:
            params = {
                "competitionId": event.get("competitionId"),
                "seasonId": event.get("seasonId"),
                "matchId": event.get("matchId"),
                "teamId": event.get("teamId"),
            }
            games = _request_json(EVENT_SCHEDULE_URL, params)["data"]
            matches.extend(
                adapted for game in games if (adapted := _adapt_game(game, event))
            )

        unique = {match["id"]: match for match in matches}
        values = sorted(unique.values(), key=lambda match: match["startsAt"])
        updated_at = _write_cache(values)
        ACQUISITION_STATE[SOURCE_KEY] = {"mode": "live", "updatedAt": updated_at}
        return values
    except Exception as exc:
        if use_cache:
            cached, updated_at = _load_cache()
            if cached or updated_at:
                ACQUISITION_STATE[SOURCE_KEY] = {
                    "mode": "cache",
                    "updatedAt": updated_at,
                    "message": str(exc),
                }
                return cached
        ACQUISITION_STATE[SOURCE_KEY] = {"mode": "unavailable", "message": str(exc)}
        raise


def get_all_data(*, use_cache: bool = True) -> dict[str, Any]:
    ACQUISITION_STATE.clear()
    errors: list[str] = []
    try:
        matches = fetch_china_men_data(use_cache=use_cache)
    except Exception as exc:
        matches = []
        errors.append(f"{SOURCE_KEY}: {exc}")

    state = ACQUISITION_STATE.get(SOURCE_KEY, {})
    if state.get("mode") == "cache":
        errors.append(
            f"{SOURCE_KEY}: 实时采集失败，使用 {state.get('updatedAt', '未知时间')} 的缓存"
        )

    return {
        "matches": matches,
        "acquisition": ACQUISITION_STATE.copy(),
        "errors": errors,
    }


if __name__ == "__main__":
    from schedule_pipeline import write_schedule_json

    result = write_schedule_json()
    print(f"Wrote {len(result['matches'])} combined matches")
