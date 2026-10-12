import React from 'react';
import { CheckSquare, Square, ShieldCheck, Thermometer, PackageCheck, AlertOctagon } from 'lucide-react';

export default function VerificationChecklist({ values, onChange }) {
  const toggle = (key) => {
    onChange({
      ...values,
      [key]: !values[key]
    });
  };

  const isAllChecked = values.temperature_checked && values.clean_packaging && values.allergens_declared && values.seller_certified;

  return (
    <div className="bg-[#faf6ee] rounded-2xl p-5 border border-[#ebdcc0] shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Food Safety & Donation Verification Checklist
            </h4>
            <p className="text-xs text-slate-600">
              Mandatory confirmation by the food operator before sharing or listing.
            </p>
          </div>
        </div>

        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
          isAllChecked 
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
            : 'bg-amber-100 text-amber-900 border-amber-300'
        }`}>
          {isAllChecked ? '✓ Fully Verified' : 'Action Required'}
        </span>
      </div>

      <div className="space-y-2.5 text-xs sm:text-sm">
        {/* Item 1 */}
        <label
          onClick={() => toggle('temperature_checked')}
          className="flex items-start space-x-3 p-2.5 rounded-xl bg-white hover:bg-emerald-50/50 border border-slate-200/80 cursor-pointer transition-colors"
        >
          <div className="mt-0.5 text-emerald-600 shrink-0">
            {values.temperature_checked ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <span className="font-semibold text-slate-800">
              Temperature History & Cold/Hot Chain Maintained
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Held constantly at safe temperature (Hot &gt;60°C / Chilled &lt;4°C / Dry bakery at room temp). Not left in danger zone (5°C–60°C).
            </p>
          </div>
        </label>

        {/* Item 2 */}
        <label
          onClick={() => toggle('clean_packaging')}
          className="flex items-start space-x-3 p-2.5 rounded-xl bg-white hover:bg-emerald-50/50 border border-slate-200/80 cursor-pointer transition-colors"
        >
          <div className="mt-0.5 text-emerald-600 shrink-0">
            {values.clean_packaging ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <span className="font-semibold text-slate-800">
              Sanitary & Food-Grade Packaging
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Food is packed in clean, food-safe containers with lids, wraps, or covers to prevent physical or airborne contamination.
            </p>
          </div>
        </label>

        {/* Item 3 */}
        <label
          onClick={() => toggle('allergens_declared')}
          className="flex items-start space-x-3 p-2.5 rounded-xl bg-white hover:bg-emerald-50/50 border border-slate-200/80 cursor-pointer transition-colors"
        >
          <div className="mt-0.5 text-emerald-600 shrink-0">
            {values.allergens_declared ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <span className="font-semibold text-slate-800">
              Allergens & Ingredients Explicitly Disclosed
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Known allergens (peanuts, dairy, gluten, soy, eggs, etc.) are declared or stated in listing notes.
            </p>
          </div>
        </label>

        {/* Item 4 */}
        <label
          onClick={() => toggle('seller_certified')}
          className="flex items-start space-x-3 p-2.5 rounded-xl bg-white hover:bg-emerald-50/50 border border-emerald-300 bg-emerald-50/30 cursor-pointer transition-colors"
        >
          <div className="mt-0.5 text-emerald-700 shrink-0">
            {values.seller_certified ? (
              <CheckSquare className="w-4 h-4 text-emerald-700" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <span className="font-bold text-emerald-950">
              Donor Operator Certification (Required to Post)
            </span>
            <p className="text-xs text-emerald-800 mt-0.5">
              I certify as the responsible food service operator that this surplus food is wholesome, unadulterated, and ready for redistribution.
            </p>
          </div>
        </label>
      </div>

      {!isAllChecked && (
        <div className="mt-3 flex items-center space-x-1.5 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
          <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Complete all checklist items to unlock official surplus distribution.</span>
        </div>
      )}
    </div>
  );
}
