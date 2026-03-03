import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 via-green-950 to-gray-950">
      {/* Hero */}
      <div className="px-6 pt-16 pb-12 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-green-800/50 rounded-full px-4 py-1 text-sm text-green-300 mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Smart RV Park Management
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          GoRV<span className="text-green-400">.ai</span>
        </h1>
        <p className="text-xl text-green-200 mb-8">
          Self-service RV park pedestal management. Scan. Pay. Connect.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all"
          >
            Park Owner Login
          </Link>
          <Link
            href="/demo"
            className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all border border-white/20"
          >
            Try Demo
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div className="px-6 pb-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <StepCard number="1" title="Scan QR Code" description="Guest arrives at pedestal and scans the QR code with their phone camera." />
          <StepCard number="2" title="Pay & Activate" description="Select stay duration, pay via Venmo or card. Utilities turn on instantly." />
          <StepCard number="3" title="Auto Shutoff" description="When time expires, water and electric shut off automatically." />
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-16 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          <FeatureCard icon="⚡" title="Automated Utility Control" description="Water valves and electrical contactors controlled via IoT. No manual switches." />
          <FeatureCard icon="💰" title="3% Platform Fee" description="Simple, transparent pricing. Park owners keep 97% of every transaction." />
          <FeatureCard icon="📱" title="No App Required" description="Works in any mobile browser. Guests scan a QR code — that is it." />
          <FeatureCard icon="📊" title="Real-time Dashboard" description="Track occupancy, revenue, and manage pricing from your park owner dashboard." />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        <p>GoRV.ai — Built by West Texas AI</p>
      </div>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">{number}</div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <span className="text-3xl">{icon}</span>
      <h3 className="text-white font-semibold text-lg mt-3 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
