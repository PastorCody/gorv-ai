import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCents } from "@/types/database";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  // Get park for this user (or first park for demo)
  let { data: park } = await service
    .from("gorv_parks")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  // Fallback: get demo park if user hasn't claimed one yet
  if (!park) {
    const { data: demoPark } = await service
      .from("gorv_parks")
      .select("*")
      .is("owner_user_id", null)
      .limit(1)
      .single();

    if (demoPark) {
      // Claim this park for the user
      await service
        .from("gorv_parks")
        .update({ owner_user_id: user.id })
        .eq("id", demoPark.id);
      park = { ...demoPark, owner_user_id: user.id };
    }
  }

  if (!park) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <h1 className="text-2xl font-bold">No Park Found</h1>
        <p className="text-gray-400 mt-2">Contact support to set up your park.</p>
      </div>
    );
  }

  // Get pedestals
  const { data: pedestals } = await service
    .from("gorv_pedestals")
    .select("*")
    .eq("park_id", park.id)
    .order("pedestal_number");

  // Get active sessions
  const { data: activeSessions } = await service
    .from("gorv_sessions")
    .select("*")
    .eq("park_id", park.id)
    .eq("status", "active");

  // Get pending sessions
  const { data: pendingSessions } = await service
    .from("gorv_sessions")
    .select("*, gorv_pedestals(pedestal_number)")
    .eq("park_id", park.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Revenue stats (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: recentTransactions } = await service
    .from("gorv_transactions")
    .select("*")
    .eq("park_id", park.id)
    .eq("status", "completed")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const totalRevenue = recentTransactions?.reduce((sum, t) => sum + t.net_to_owner_cents, 0) || 0;
  const totalSessions = recentTransactions?.length || 0;
  const occupiedCount = pedestals?.filter((p) => p.status === "occupied").length || 0;
  const totalPedestals = pedestals?.length || 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-green-400">GoRV.ai</h1>
          <p className="text-gray-400 text-sm">{park.name}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/qr" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-all">
            QR Codes
          </Link>
          <Link href="/dashboard/revenue" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-all">
            Revenue
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Occupancy" value={`${occupiedCount}/${totalPedestals}`} color="green" />
          <StatCard label="Active Sessions" value={String(activeSessions?.length || 0)} color="blue" />
          <StatCard label="Revenue (30d)" value={formatCents(totalRevenue)} color="yellow" />
          <StatCard label="Bookings (30d)" value={String(totalSessions)} color="purple" />
        </div>

        {/* Pending Payments */}
        {pendingSessions && pendingSessions.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-yellow-400 mb-3">
              Pending Payments ({pendingSessions.length})
            </h2>
            <div className="space-y-2">
              {pendingSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                  <div>
                    <span className="font-medium">
                      Site #{(s.gorv_pedestals as { pedestal_number: number })?.pedestal_number}
                    </span>
                    <span className="text-gray-400 ml-2 text-sm">
                      {s.guest_name || "Guest"} — {s.duration}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 font-bold">{formatCents(s.amount_cents)}</span>
                    <form action={`/api/sessions/${s.id}/confirm`} method="POST">
                      <input type="hidden" name="payment_reference" value="manual_confirm" />
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-1.5 rounded-lg transition-all"
                      >
                        Confirm Payment
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pedestals Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-3">All Sites</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pedestals?.map((p) => {
              const activeSession = activeSessions?.find((s) => s.pedestal_id === p.id);
              return (
                <div
                  key={p.id}
                  className={`rounded-xl p-4 border ${
                    p.status === "occupied"
                      ? "bg-green-500/10 border-green-500/30"
                      : p.status === "maintenance"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-gray-900 border-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">#{p.pedestal_number}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === "occupied"
                          ? "bg-green-500/20 text-green-400"
                          : p.status === "maintenance"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {p.amp_rating}A {p.has_water ? "• Water" : "• No Water"}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatCents(p.price_day_cents)}/day
                  </div>
                  {activeSession && (
                    <div className="mt-2 text-xs text-green-400">
                      Ends: {new Date(activeSession.end_time).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: "text-green-400",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
    purple: "text-purple-400",
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorMap[color]}`}>{value}</p>
    </div>
  );
}
