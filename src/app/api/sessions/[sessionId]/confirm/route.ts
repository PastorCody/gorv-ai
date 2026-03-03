import { createServiceClient } from "@/lib/supabase/server";
import { sendIoTCommand } from "@/lib/services/iot";
import { calculatePlatformFee, calculateNetToOwner } from "@/lib/services/payment";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await request.json();
  const { payment_reference } = body;

  const supabase = createServiceClient();

  // Get session
  const { data: session, error } = await supabase
    .from("gorv_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "pending") {
    return NextResponse.json({ error: "Session is not pending" }, { status: 400 });
  }

  // Update session to active
  const now = new Date();
  const endTime = new Date(now);
  switch (session.duration) {
    case "day":
      endTime.setHours(endTime.getHours() + 24);
      break;
    case "week":
      endTime.setDate(endTime.getDate() + 7);
      break;
    case "month":
      endTime.setMonth(endTime.getMonth() + 1);
      break;
  }

  const { error: updateError } = await supabase
    .from("gorv_sessions")
    .update({
      status: "active",
      payment_reference: payment_reference || "confirmed",
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
    })
    .eq("id", sessionId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to activate session" }, { status: 500 });
  }

  // Create transaction record
  await supabase.from("gorv_transactions").insert({
    session_id: sessionId,
    park_id: session.park_id,
    gross_amount_cents: session.amount_cents,
    platform_fee_cents: calculatePlatformFee(session.amount_cents),
    net_to_owner_cents: calculateNetToOwner(session.amount_cents),
    payment_method: session.payment_method,
    payment_reference: payment_reference || "confirmed",
    status: "completed",
  });

  // Activate IoT devices
  await sendIoTCommand(session.pedestal_id, sessionId, "activate", "both");

  return NextResponse.json({ success: true, message: "Session activated, utilities ON" });
}
