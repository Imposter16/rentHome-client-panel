import Link from 'next/link';
import { Building2, ArrowRight, ShieldCheck, Search, Key, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight">RentHome</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-300 backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Next-Gen PropTech Marketplace for Modern Renters & Landlords</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
          Find, Tour & Lease <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
            Your Next Home Instantly
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
          Centralized rental platform powering instant property discovery, verified landlord screening, paperless booking inquiries, and digital lease workflows.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
          <Link
            href="/properties"
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Explore Properties</span>
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span>Landlord Portal</span>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left w-full">
          <div className="p-5 bg-slate-800/50 border border-slate-700/60 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-indigo-400 mb-2" />
            <h3 className="font-bold text-white text-sm">Verified Listings</h3>
            <p className="text-xs text-slate-400 mt-1">Every listing is verified by administrators to eliminate scams and duplicate postings.</p>
          </div>

          <div className="p-5 bg-slate-800/50 border border-slate-700/60 rounded-2xl">
            <Building2 className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="font-bold text-white text-sm">Direct Landlord Contact</h3>
            <p className="text-xs text-slate-400 mt-1">Submit inquiries directly to verified property owners with zero intermediary brokerage fees.</p>
          </div>

          <div className="p-5 bg-slate-800/50 border border-slate-700/60 rounded-2xl">
            <ArrowRight className="w-6 h-6 text-emerald-400 mb-2" />
            <h3 className="font-bold text-white text-sm">Fast-Track Screening</h3>
            <p className="text-xs text-slate-400 mt-1">Pre-filled tenant profiles for instant application submission and quick decisions.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800 text-center text-xs text-slate-500">
        &copy; 2026 RentHome Technologies Inc. All rights reserved.
      </footer>
    </div>
  );
}
