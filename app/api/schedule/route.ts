import { NextResponse } from "next/server";
import { getCombinedSchedule } from "@/lib/scheduleData";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const response = await getCombinedSchedule();
  return NextResponse.json(response, {
    headers: {
      "cache-control": "s-maxage=300, stale-while-revalidate=120"
    }
  });
}
