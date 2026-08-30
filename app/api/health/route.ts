import { NextResponse } from "next/server";

import { getConfigurationStatus } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Skylark Intelligence",
    configuration: getConfigurationStatus(),
  });
}
