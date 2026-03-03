"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatCents, getDurationLabel, type Session, type Pedestal, type Park } from "@/types/database";

export default function SessionStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const isPending = searchParams.get("pending") === "true";

  const [session, setSession] = useState<Session | null>(null);
  const [pedestal, setPedestal] = useState<Pedestal | null>(null);
  const [park, setPark] = useState<Park | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [percentLeft, setPercentLeft] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setPedestal(data.pedestal);
        setPark(data.park);
      }
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (!session || session.status !== "active") return;

    function updateTimer() {
      const now = new Date().getTime();
      const end = new Date(session!.end_time).getTime();
      const start = new Date(session!.start_time).getTime();
      const remaining = end - now;
      const total = end - start;

      if (remaining <= 0) {
        setTimeLeft("Expired");
        setPercentLeft(0);
        return;
      }

      setPercentLeft(Math.round((remaining / total) * 100));

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">Session Not Found</h1>
          <p className="text-green-400 mt-2">This session may have expired or does not exist.</p>
        </div>
      </div>
    );
  }

  const isActive = session.status === "active";
  const isPendingPayment = session.status === "pending";
  const isExpired = session.status === "expired";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 text-white">
      <div className="px-4 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-2 bg-green-800/50 rounded-full px-4 py-1 text-sm mb-4">
          GoRV.ai
        </div>
        {park && <h1 className="text-xl font-bold">{park.name}</h1>}
        {pedestal && (
          <p className="text-green-300">Site #{pedestal.pedestal_number}</p>
        )}
      </div>

      {/* Status Card */}
      <div className="px-4 pb-4">
        <div className={`rounded-2xl p-6 text-center ${
          isActive ? "bg-green-500/20 border border-green-500/50" :
          isPendingPayment ? "bg-yellow-500/20 border border-yellow-500/50" :
          "bg-red-500/20 border border-red-500/50"
        }`}>
          <div className={`text-5xl mb-2 ${
            isActive ? "text-green-400" : isPendingPayment ? "text-yellow-400" : "text-red-400"
          }`}>
            {isActive ? "⚡" : isPendingPayment ? "⏳" : "⏹"}
          </div>
          <div className={`text-2xl font-bold ${
            isActive ? "text-green-400" : isPendingPayment ? "text-yellow-400" : "text-red-400"
          }`}>
            {isActive ? "Utilities Active" : isPendingPayment ? "Awaiting Payment" : "Session Ended"}
          </div>
        </div>
      </div>

      {/* Timer */}
      {isActive && (
        <div className="px-4 pb-4">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
            <p className="text-green-300 text-sm mb-2">Time Remaining</p>
            <div className="text-4xl font-mono font-bold text-white">{timeLeft}</div>
            <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  percentLeft > 20 ? "bg-green-500" : "bg-red-500"
                }`}
                style={{ width: `${percentLeft}%` }}
              />
            </div>
            <div className="mt-3 flex justify-center gap-4 text-sm">
              {session.water_on && (
                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                  💧 Water ON
                </span>
              )}
              {session.electric_on && (
                <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">
                  ⚡ Electric ON
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Session Details */}
      <div className="px-4 pb-4">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-3 text-sm">
          <h2 className="font-semibold text-lg mb-2">Session Details</h2>
          <div className="flex justify-between">
            <span className="text-green-300">Duration</span>
            <span>{getDurationLabel(session.duration)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-300">Amount Paid</span>
            <span>{formatCents(session.amount_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-300">Started</span>
            <span>{new Date(session.start_time).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-300">Ends</span>
            <span>{new Date(session.end_time).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-300">Payment</span>
            <span className="capitalize">{session.payment_method}</span>
          </div>
          {session.guest_name && (
            <div className="flex justify-between">
              <span className="text-green-300">Guest</span>
              <span>{session.guest_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {isPendingPayment && isPending && (
        <div className="px-4 pb-4">
          <div className="bg-yellow-500/10 rounded-2xl p-6 text-center">
            <p className="text-yellow-300 text-sm mb-3">
              Complete your Venmo payment, then your park host will confirm it.
            </p>
            <p className="text-green-400 text-xs">
              Session ID: {session.id.slice(0, 8)}...
            </p>
          </div>
        </div>
      )}

      {isActive && (
        <div className="px-4 pb-4">
          <a
            href={`/p/${session.park_id}/${session.pedestal_id}/pay?duration=${session.duration}`}
            className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-center transition-all"
          >
            Extend Stay
          </a>
        </div>
      )}

      {isExpired && pedestal && (
        <div className="px-4 pb-4">
          <a
            href={`/p/${session.park_id}/${session.pedestal_id}`}
            className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-center transition-all"
          >
            Book Again
          </a>
        </div>
      )}

      <div className="text-center text-green-600 text-xs pb-6">
        Powered by GoRV.ai
      </div>
    </div>
  );
}
