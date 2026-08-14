#!/usr/bin/env python3
"""Combine Tencent basketball and Riot LoL Esports schedules into one payload."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from china_mens_basketball_data import get_all_data as get_china_men_data
from lol_esports_data import get_all_data as get_lol_data
from tencent_sports_data import OUTPUT_FILE, get_all_data as get_basketball_data


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_schedule(*, use_cache: bool = True) -> dict[str, Any]:
    basketball = get_basketball_data(use_cache=use_cache)
    china_men = get_china_men_data(use_cache=use_cache)
    lol = get_lol_data(use_cache=use_cache)
    unique = {
        match["id"]: match
        for match in [
            *basketball.get("matches", []),
            *china_men.get("matches", []),
            *lol.get("matches", []),
        ]
    }

    return {
        "generatedAt": utc_now(),
        "matches": sorted(unique.values(), key=lambda match: match.get("startsAt", "")),
        "acquisition": {
            **basketball.get("acquisition", {}),
            **china_men.get("acquisition", {}),
            **lol.get("acquisition", {}),
        },
        "errors": [
            *basketball.get("errors", []),
            *china_men.get("errors", []),
            *lol.get("errors", []),
        ],
    }


def write_schedule_json(output_file: Path | None = None) -> dict[str, Any]:
    target = output_file or OUTPUT_FILE
    payload = build_schedule()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return payload


if __name__ == "__main__":
    result = write_schedule_json()
    print(f"Wrote {len(result['matches'])} matches with {len(result['errors'])} errors")
