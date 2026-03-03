import { createServiceClient } from "@/lib/supabase/server";
import { sendIoTCommand } from "@/lib/services/iot";
import { NextRequest, NextResponse } from "next/server";

// Vercel Cron: runs every minute
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServiceClient();

  // Find active sessions that have expired
  const { data: expiredSessions, error } = await supabase
    .from("gorv_sessions")
    .select("*")
    .eq("status", "active")
    .lte("end_time", new Date().toISOString());

  if (error) {
    console.error("Error fetching expired sessions:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!expiredSessions || expiredSessions.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  let expiredCount = 0;
  for (const session of expiredSessions) {
    // Deactivate IoT devices
    await sendIoTCommand(session.pedestal_id, session.id, "deactivate", "both");

    // Update session status
    await supabase
      .from("gorv_sessions")
      .update({ status: "expired", water_on: false, electric_on: false })
      .eq("id", session.id);

    // Update pedestal to available
    await supabase
      .from("gorv_pedestals")
      .update({ status: "available" })
      .eq("id", session.pedestal_id);

    expiredCount++;
    console.log(`[CRON] Expired session ${session.id} - Pedestal ${session.pedestal_id} deactivated`);
  }

  return NextResponse.json({ expired: expiredCount });
}
