#!/usr/bin/env python3
"""
Compatibility wrapper for the schedule acquisition pipeline.

The dashboard still calls `npm run scrape:schedules`, while the implementation
combines Tencent NBA/CBA, China Basketball Association men's national team,
and Riot LoL Esports data.
"""

from __future__ import annotations

from schedule_pipeline import write_schedule_json


def main() -> int:
    payload = write_schedule_json()
    print(f"Wrote {len(payload['matches'])} matches to data/schedule.json")
    if payload.get("errors"):
        print("\n".join(payload["errors"]))
    return 0 if payload.get("matches") else 1


if __name__ == "__main__":
    raise SystemExit(main())
