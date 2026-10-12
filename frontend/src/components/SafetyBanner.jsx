import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, Info } from 'lucide-react';

export default function SafetyBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-y border-amber-200/80 px-4 py-3 sm:px-6 shadow-xs">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5 text-orange-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 text-sm">
                  Mandatory Food Safety & AI Boundary Disclaimer
                </span>
                <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-orange-200 text-orange-900 rounded-md">
                  Strict Rule
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">
                <strong>AI cannot certify food safety or automatically determine donation eligibility.</strong> All food freshness, safe holding temperatures, and allergen disclosures must be personally inspected and confirmed by the donor.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-orange-800 hover:text-orange-950 bg-white/70 hover:bg-white px-3 py-1.5 rounded-lg border border-amber-300 transition-colors shrink-0"
          >
            <span>{expanded ? 'Hide Safety Protocol' : 'Read Safety Rules'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

        </div>

        {/* Expandable Safety Protocol */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-amber-200/60 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-slate-700">
            <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80">
              <div className="flex items-center space-x-2 font-semibold text-slate-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span>Photos Do Not Equal Freshness</span>
              </div>
              <p>
                A photo only shows presentation. It cannot detect bacterial proliferation, broken cold chains, or temperature abuse. Donor verification is legally required.
              </p>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80">
              <div className="flex items-center space-x-2 font-semibold text-slate-900 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Hallucination Policy</span>
              </div>
              <p>
                Our system never invents expiry dates, ingredients, quantities, or storage history. Missing information is flagged explicitly for operator review.
              </p>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80">
              <div className="flex items-center space-x-2 font-semibold text-slate-900 mb-1">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Controlled Distribution</span>
              </div>
              <p>
                MealMitra does not broadcast listings automatically. The donor previews, audits, and initiates the share to recipient channels on their terms.
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
