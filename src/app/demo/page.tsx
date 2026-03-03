import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DemoPage() {
  const supabase = createServiceClient();

  // Get demo park
  const { data: park } = await supabase
    .from("gorv_parks")
    .select("id")
    .eq("name", "West Texas RV Ranch")
    .single();

  if (!park) {
    return (
      <div className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Demo park not found. Run the schema migration first.</p>
      </div>
    );
  }

  // Get first pedestal
  const { data: pedestal } = await supabase
    .from("gorv_pedestals")
    .select("id")
    .eq("park_id", park.id)
    .order("pedestal_number")
    .limit(1)
    .single();

  if (!pedestal) {
    return (
      <div className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>No pedestals found.</p>
      </div>
    );
  }

  redirect(`/p/${park.id}/${pedestal.id}`);
}
