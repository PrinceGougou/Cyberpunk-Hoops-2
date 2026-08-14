import { NextResponse } from "next/server";
import { getCombinedSchedule } from "@/lib/scheduleData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const schedule = await getCombinedSchedule();
  const counts = schedule.matches.reduce(
    (result, match) => {
      result.total += 1;
      result[match.status.toLowerCase() as "upcoming" | "live" | "finished"] += 1;
      return result;
    },
    { total: 0, upcoming: 0, live: 0, finished: 0 }
  );
  const available = counts.total > 0;

  return NextResponse.json(
    {
      status: available ? (schedule.isStale ? "degraded" : "ok") : "unavailable",
      checkedAt: new Date().toISOString(),
      counts,
      sources: schedule.sources
    },
    {
      status: available ? 200 : 503,
      headers: { "cache-control": "no-store" }
    }
  );
}
