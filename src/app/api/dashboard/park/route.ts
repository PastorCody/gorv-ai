import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: park } = await service
    .from("gorv_parks")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  if (!park) {
    return NextResponse.json({ error: "No park found" }, { status: 404 });
  }

  const { data: pedestals } = await service
    .from("gorv_pedestals")
    .select("*")
    .eq("park_id", park.id)
    .order("pedestal_number");

  return NextResponse.json({ park, pedestals });
}
