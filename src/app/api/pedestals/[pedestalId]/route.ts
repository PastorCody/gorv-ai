import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pedestalId: string }> }
) {
  const { pedestalId } = await params;
  const parkId = request.nextUrl.searchParams.get("parkId");
  const supabase = createServiceClient();

  let query = supabase
    .from("gorv_pedestals")
    .select("*")
    .eq("id", pedestalId);

  if (parkId) query = query.eq("park_id", parkId);

  const { data: pedestal, error } = await query.single();

  if (error || !pedestal) {
    return NextResponse.json({ error: "Pedestal not found" }, { status: 404 });
  }

  const { data: park } = await supabase
    .from("gorv_parks")
    .select("*")
    .eq("id", pedestal.park_id)
    .single();

  return NextResponse.json({ pedestal, park });
}
