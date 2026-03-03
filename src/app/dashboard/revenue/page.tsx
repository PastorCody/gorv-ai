import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatCents } from "@/types/database";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RevenuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  // Get user's park
  const { data: park } = await service
    .from("gorv_parks")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  if (!park) redirect("/dashboard");

  // Get all transactions
  const { data: transactions } = await service
    .from("gorv_transactions")
    .select("*, gorv_sessions(duration, gorv_pedestals(pedestal_number))")
    .eq("park_id", park.id)
    .order("created_at", { ascending: false });

  // Calculate totals
  const allTime = transactions || [];
  const totalGross = allTime.reduce((s, t) => s + t.gross_amount_cents, 0);
  const totalFees = allTime.reduce((s, t) => s + t.platform_fee_cents, 0);
  const totalNet = allTime.reduce((s, t) => s + t.net_to_owner_cents, 0);

  // Last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentTxns = allTime.filter((t) => new Date(t.created_at) >= sevenDaysAgo);
  const weekGross = recentTxns.reduce((s, t) => s + t.gross_amount_cents, 0);
  const weekNet = recentTxns.reduce((s, t) => s + t.net_to_owner_cents, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-green-400 hover:underline">← Dashboard</Link>
          <h1 className="text-xl font-bold">Revenue</h1>
        </div>
        <p className="text-gray-400 text-sm">{park.name}</p>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Revenue Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Gross</p>
            <p className="text-2xl font-bold text-white mt-1">{formatCents(totalGross)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Platform Fees (3%)</p>
            <p className="text-2xl font-bold text-red-400 mt-1">-{formatCents(totalFees)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Your Revenue</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{formatCents(totalNet)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm">This Week</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{formatCents(weekNet)}</p>
            <p className="text-xs text-gray-500">{recentTxns.length} bookings</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold">Transaction History</h2>
          </div>
          {allTime.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No transactions yet</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {allTime.map((t) => {
                const sess = t.gorv_sessions as { duration: string; gorv_pedestals: { pedestal_number: number } } | null;
                return (
                  <div key={t.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        Site #{sess?.gorv_pedestals?.pedestal_number || "?"}
                      </span>
                      <span className="text-gray-400 ml-2 text-sm capitalize">
                        {sess?.duration || ""} stay
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{formatCents(t.net_to_owner_cents)}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(t.created_at).toLocaleDateString()} · {t.payment_method}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
