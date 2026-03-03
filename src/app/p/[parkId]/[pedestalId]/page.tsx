import { createServiceClient } from "@/lib/supabase/server";
import { formatCents } from "@/types/database";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PedestalLanding({
  params,
}: {
  params: Promise<{ parkId: string; pedestalId: string }>;
}) {
  const { parkId, pedestalId } = await params;
  const supabase = createServiceClient();

  // Fetch park
  const { data: park } = await supabase
    .from("gorv_parks")
    .select("*")
    .eq("id", parkId)
    .single();

  if (!park) return notFound();

  // Fetch pedestal
  const { data: pedestal } = await supabase
    .from("gorv_pedestals")
    .select("*")
    .eq("id", pedestalId)
    .eq("park_id", parkId)
    .single();

  if (!pedestal) return notFound();

  // Check if occupied
  const isOccupied = pedestal.status === "occupied";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 text-white">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-2 bg-green-800/50 rounded-full px-4 py-1 text-sm mb-4">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          GoRV.ai
        </div>
        <h1 className="text-2xl font-bold">{park.name}</h1>
        <p className="text-green-300 mt-1">{park.address}</p>
      </div>

      {/* Pedestal Info */}
      <div className="px-4 pb-4">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
          <div className="text-6xl font-bold text-green-400">
            #{pedestal.pedestal_number}
          </div>
          <div className="mt-2 flex justify-center gap-3 text-sm">
            <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">
              {pedestal.amp_rating}A Electric
            </span>
            {pedestal.has_water && (
              <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                Water
              </span>
            )}
          </div>
          {isOccupied && (
            <div className="mt-4 bg-red-500/20 text-red-300 rounded-lg p-3 text-sm">
              This site is currently occupied
            </div>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      {!isOccupied && (
        <div className="px-4 space-y-3 pb-8">
          <h2 className="text-lg font-semibold text-center mb-4">
            Select Your Stay Duration
          </h2>

          <PriceOption
            label="1 Day"
            price={pedestal.price_day_cents}
            description={`${pedestal.amp_rating}A electric${pedestal.has_water ? " + water" : ""}`}
            href={`/p/${parkId}/${pedestalId}/pay?duration=day`}
          />
          <PriceOption
            label="1 Week"
            price={pedestal.price_week_cents}
            description={`${pedestal.amp_rating}A electric${pedestal.has_water ? " + water" : ""} — Save ${Math.round((1 - pedestal.price_week_cents / (pedestal.price_day_cents * 7)) * 100)}%`}
            href={`/p/${parkId}/${pedestalId}/pay?duration=week`}
            popular
          />
          <PriceOption
            label="1 Month"
            price={pedestal.price_month_cents}
            description={`${pedestal.amp_rating}A electric${pedestal.has_water ? " + water" : ""} — Best value`}
            href={`/p/${parkId}/${pedestalId}/pay?duration=month`}
          />
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-green-500 text-xs pb-6">
        Powered by GoRV.ai — Smart RV Park Management
      </div>
    </div>
  );
}

function PriceOption({
  label,
  price,
  description,
  href,
  popular,
}: {
  label: string;
  price: number;
  description: string;
  href: string;
  popular?: boolean;
}) {
  return (
    <Link href={href} className="block">
      <div
        className={`relative rounded-xl p-4 transition-all active:scale-[0.98] ${
          popular
            ? "bg-green-500 text-white ring-2 ring-green-400"
            : "bg-white/10 hover:bg-white/15"
        }`}
      >
        {popular && (
          <span className="absolute -top-2 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            POPULAR
          </span>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-lg">{label}</div>
            <div className={`text-sm ${popular ? "text-green-100" : "text-green-300"}`}>
              {description}
            </div>
          </div>
          <div className="text-2xl font-bold">{formatCents(price)}</div>
        </div>
      </div>
    </Link>
  );
}
