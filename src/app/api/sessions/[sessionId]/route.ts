import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = createServiceClient();

  const { data: session, error } = await supabase
    .from("gorv_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: pedestal } = await supabase
    .from("gorv_pedestals")
    .select("*")
    .eq("id", session.pedestal_id)
    .single();

  const { data: park } = await supabase
    .from("gorv_parks")
    .select("*")
    .eq("id", session.park_id)
    .single();

  return NextResponse.json({ session, pedestal, park });
}
