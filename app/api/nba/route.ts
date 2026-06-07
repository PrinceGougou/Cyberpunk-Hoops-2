import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import type { MatchData, ScheduleResponse } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 300;

async function readTencentSchedule() {
  const schedulePath = join(process.cwd(), "data", "schedule.json");
  const file = await readFile(schedulePath, "utf8");
  return JSON.parse(file) as { generatedAt?: string; matches?: MatchData[]; errors?: string[] };
}

export async function GET() {
  try {
    const payload = await readTencentSchedule();
    const matches = (payload.matches || []).filter((match) => match.league === "NBA");

    const response: ScheduleResponse = {
      generatedAt: payload.generatedAt || new Date().toISOString(),
      matches,
      standings: [],
      errors: payload.errors
    };

    return NextResponse.json(response, {
      headers: {
        "cache-control": "s-maxage=300, stale-while-revalidate=120"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        matches: [],
        standings: [],
        errors: [`Tencent schedule cache unavailable: ${error instanceof Error ? error.message : String(error)}`]
      },
      { status: 200 }
    );
  }
}
