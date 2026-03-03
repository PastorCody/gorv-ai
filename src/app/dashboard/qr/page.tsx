"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Park, Pedestal } from "@/types/database";
import Link from "next/link";

export default function QRGeneratorPage() {
  const [park, setPark] = useState<Park | null>(null);
  const [pedestals, setPedestals] = useState<Pedestal[]>([]);
  const [loading, setLoading] = useState(true);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use service-level fetch via API
      const res = await fetch("/api/dashboard/park");
      if (res.ok) {
        const data = await res.json();
        setPark(data.park);
        setPedestals(data.pedestals || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-green-400 hover:underline">← Dashboard</Link>
        <h1 className="text-xl font-bold">QR Codes</h1>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-gray-400 mb-6">
          Print these QR codes and mount them on each pedestal. Guests scan to book and pay.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedestals.map((p) => {
            const url = `${appUrl}/p/${park?.id}/${p.id}`;
            return (
              <div key={p.id} className="bg-white rounded-2xl p-6 text-center">
                <div className="bg-gray-100 rounded-xl p-4 mb-4">
                  {/* QR Code as SVG placeholder — in production use a QR library */}
                  <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
                      alt={`QR Code for Site ${p.pedestal_number}`}
                      className="w-44 h-44"
                    />
                  </div>
                </div>
                <h3 className="text-gray-900 text-xl font-bold">Site #{p.pedestal_number}</h3>
                <p className="text-gray-500 text-sm">
                  {p.amp_rating}A {p.has_water ? "• Water" : ""}
                </p>
                <p className="text-gray-400 text-xs mt-2 break-all">{url}</p>
                <button
                  onClick={() => window.print()}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-500 transition-all"
                >
                  Print
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
