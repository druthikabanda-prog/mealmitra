import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ShieldCheck, 
  RefreshCw, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { fetchImpactStats } from '../services/api';

export default function ImpactDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImpactStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load impact metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-[#ebdcc0] p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#ebdcc0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              MealMitra Verified Impact
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Verified redistribution metrics computed strictly from SQLite database records.
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs mt-6 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : loading && !stats ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {/* Main Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* Total Listings Published */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-xs font-bold uppercase tracking-wider">Listings</span>
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                  {stats?.total_listings_published ?? 0}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">Published items</div>
              </div>
            </div>

            {/* Total Quantity Offered */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-xs font-bold uppercase tracking-wider">Offered</span>
                <Layers className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                  {stats?.total_quantity_offered ?? 0}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">Total portions offered</div>
              </div>
            </div>

            {/* Total Quantity Collected */}
            <div className="p-4 rounded-2xl bg-green-50/70 border border-green-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-green-800">
                <span className="text-xs font-bold uppercase tracking-wider">Rescued</span>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-green-800 font-display">
                  {stats?.total_quantity_collected ?? 0}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">Portions collected</div>
              </div>
            </div>

            {/* Active Available */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-sky-800">
                <span className="text-xs font-bold uppercase tracking-wider">Available</span>
                <Clock className="w-4 h-4 text-sky-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                  {stats?.active_available_listings ?? 0}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">Currently claimable</div>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-orange-800">
                <span className="text-xs font-bold uppercase tracking-wider">Requested</span>
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-orange-700 font-display">
                  {stats?.pending_claim_requests ?? 0}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">Awaiting donor approval</div>
              </div>
            </div>

            {/* Completed Rescues */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-purple-800">
                <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-purple-900 font-display">
                  {stats?.completed_food_rescues ?? 0}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">Finished pickups</div>
              </div>
            </div>

          </div>

          {/* Genuine Impact Methodology Note */}
          <div className="p-4 rounded-2xl bg-[#faf6ee] border border-[#ebdcc0] flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong>Data Authenticity Commitment:</strong> MealMitra separates portions offered from portions actually collected and verified by kitchen staff. We intentionally do not invent artificial meal approximations, CO₂ savings, or unverified recipient tallies. Every figure above corresponds to a real SQLite database transaction.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
