"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { formatCents, getDurationLabel, type Pedestal, type Park } from "@/types/database";

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const parkId = params.parkId as string;
  const pedestalId = params.pedestalId as string;
  const duration = searchParams.get("duration") || "day";

  const [pedestal, setPedestal] = useState<Pedestal | null>(null);
  const [park, setPark] = useState<Park | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/pedestals/${pedestalId}?parkId=${parkId}`);
      if (res.ok) {
        const data = await res.json();
        setPedestal(data.pedestal);
        setPark(data.park);
      }
      setLoading(false);
    }
    load();
  }, [pedestalId, parkId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-400" />
      </div>
    );
  }

  if (!pedestal || !park) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 text-white flex items-center justify-center">
        <p>Pedestal not found</p>
      </div>
    );
  }

  const priceKey = `price_${duration}_cents` as keyof Pedestal;
  const amountCents = pedestal[priceKey] as number;
  const amountDollars = amountCents / 100;
  const platformFee = Math.round(amountCents * 0.03);

  async function handlePayment(method: "venmo" | "simulate") {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedestal_id: pedestalId,
          park_id: parkId,
          duration,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          payment_method: method,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create session");
        setSubmitting(false);
        return;
      }

      if (method === "simulate") {
        // Simulate payment — auto-confirm
        const confirmRes = await fetch(`/api/sessions/${data.session.id}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_reference: "SIMULATED_PAYMENT" }),
        });
        if (confirmRes.ok) {
          window.location.href = `/session/${data.session.id}`;
        } else {
          setError("Payment simulation failed");
          setSubmitting(false);
        }
        return;
      } else {
        // Open Venmo
        const venmoNote = `GoRV - ${park!.name} Site #${pedestal!.pedestal_number} - ${getDurationLabel(duration)}`;
        const venmoUrl = `https://venmo.com/${park!.venmo_username}?txn=pay&amount=${amountDollars.toFixed(2)}&note=${encodeURIComponent(venmoNote)}`;
        window.open(venmoUrl, "_blank");
        // Redirect to pending session page
        window.location.href = `/session/${data.session.id}?pending=true`;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 text-white">
      <div className="px-4 pt-8 pb-4">
        <button
          onClick={() => router.back()}
          className="text-green-400 text-sm mb-4 flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-800/50 rounded-full px-4 py-1 text-sm mb-2">
            GoRV.ai
          </div>
          <h1 className="text-xl font-bold">{park.name}</h1>
          <p className="text-green-300">
            Site #{pedestal.pedestal_number} — {getDurationLabel(duration)}
          </p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="px-4 pb-4">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-3">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-300">Stay Duration</span>
              <span>{getDurationLabel(duration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-300">Hookups</span>
              <span>
                {pedestal.amp_rating}A Electric
                {pedestal.has_water ? " + Water" : ""}
              </span>
            </div>
            <hr className="border-white/10 my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-green-400">{formatCents(amountCents)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Info */}
      <div className="px-4 pb-4">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold text-lg mb-1">Your Info</h2>
          <input
            type="text"
            placeholder="Name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-green-400/50 outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-green-400/50 outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-green-400/50 outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Payment Buttons */}
      <div className="px-4 pb-4 space-y-3">
        {error && (
          <div className="bg-red-500/20 text-red-300 rounded-lg p-3 text-sm text-center">
            {error}
          </div>
        )}

        {park.venmo_username && (
          <button
            onClick={() => handlePayment("venmo")}
            disabled={submitting}
            className="w-full bg-[#008CFF] hover:bg-[#0070CC] text-white font-bold py-4 rounded-xl text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
              <path d="M19.5 1.5c.75 1.23 1.08 2.5 1.08 4.08 0 5.06-4.32 11.64-7.83 16.27H5.34L2.25 2.46l6.63-.63 1.77 14.22c1.65-2.7 3.69-6.93 3.69-9.84 0-1.5-.27-2.52-.72-3.36l5.88-1.35z" />
            </svg>
            {submitting ? "Processing..." : `Pay ${formatCents(amountCents)} with Venmo`}
          </button>
        )}

        <button
          onClick={() => handlePayment("simulate")}
          disabled={submitting}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl text-lg transition-all disabled:opacity-50"
        >
          {submitting ? "Processing..." : `⚡ Simulate Payment (${formatCents(amountCents)})`}
        </button>
        <p className="text-center text-green-500 text-xs">
          Simulate Payment instantly activates utilities for testing
        </p>
      </div>

      <div className="text-center text-green-600 text-xs pb-6">
        Platform fee: {formatCents(platformFee)} (3%) · Powered by GoRV.ai
      </div>
    </div>
  );
}
