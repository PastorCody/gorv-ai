import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { calculatePlatformFee } from "@/lib/services/payment";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { pedestal_id, park_id, duration, guest_name, guest_email, guest_phone, payment_method } = body;

  if (!pedestal_id || !park_id || !duration) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get pedestal pricing
  const { data: pedestal, error: pedError } = await supabase
    .from("gorv_pedestals")
    .select("*")
    .eq("id", pedestal_id)
    .single();

  if (pedError || !pedestal) {
    return NextResponse.json({ error: "Pedestal not found" }, { status: 404 });
  }

  if (pedestal.status === "occupied") {
    return NextResponse.json({ error: "This site is currently occupied" }, { status: 409 });
  }

  // Calculate pricing
  const priceKey = `price_${duration}_cents` as keyof typeof pedestal;
  const amountCents = pedestal[priceKey] as number;
  const platformFee = calculatePlatformFee(amountCents);

  // Calculate end time
  const now = new Date();
  const endTime = new Date(now);
  switch (duration) {
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

  // Create session
  const { data: session, error: sessError } = await supabase
    .from("gorv_sessions")
    .insert({
      pedestal_id,
      park_id,
      guest_name: guest_name || null,
      guest_email: guest_email || null,
      guest_phone: guest_phone || null,
      duration,
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
      amount_cents: amountCents,
      platform_fee_cents: platformFee,
      payment_method: payment_method || "venmo",
      status: "pending",
    })
    .select()
    .single();

  if (sessError) {
    console.error("Session creation error:", sessError);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  return NextResponse.json({ session });
}
