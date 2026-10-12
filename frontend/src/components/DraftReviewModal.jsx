import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Copy, 
  Check,
  Tag, 
  ShieldAlert,
  Cpu,
  Edit3
} from 'lucide-react';

export default function DraftReviewModal({ draft, rawForm, isOpen, onClose, onConfirmPublish }) {
  if (!isOpen || !draft) return null;

  // Extract fields from either root or draft.generated
  const gen = draft.generated?.generated || draft.generated || {};
  const sellerFacts = draft.seller_facts || draft.generated?.seller_facts || {};
  const missingChecklist = gen.missing_details_checklist || draft.unverified_flags || [];
  const safetyNotice = draft.safety_notice || "AI cannot certify food safety or automatically determine donation eligibility.";
  const tags = gen.tags || gen.suggested_tags || [];
  const initialShareable = gen.shareable_message || draft.shareable_message || '';

  const [messageText, setMessageText] = useState(initialShareable);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMessageText(initialShareable);
    setCopied(false);
  }, [initialShareable]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full border border-[#ebdcc0] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 via-[#faf6ee] to-emerald-50 px-6 py-4 border-b border-[#ebdcc0] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-orange-100 rounded-xl text-orange-700">
              <Sparkles className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-bold text-lg text-slate-900">
                  MealMitra Gemma 4 Listing Review
                </h3>
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Cpu className="w-2.5 h-2.5" />
                  <span>{gen.model || 'gemma4:e2b'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Review verified physical facts, AI suggestions, and missing details checklist.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Safety Disclaimer Warning */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start space-x-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Safety Notice: </span>
              <span>{safetyNotice}</span>
            </div>
          </div>

          {/* 1. SELLER FACTS */}
          <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-4 shadow-xs">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>1. Confirmed Donor Facts (Physical Reality)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Food Item</span>
                <span className="font-semibold text-slate-900">{sellerFacts.food_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantity</span>
                <span className="font-semibold text-slate-900">{sellerFacts.quantity || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Prep Timestamp</span>
                <span>{sellerFacts.prep_time || 'Unspecified'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pickup Deadline</span>
                <span className="text-orange-700 font-bold">{sellerFacts.deadline || 'Unspecified'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Storage History</span>
                <span>{sellerFacts.storage_details || 'Unspecified'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Seller Contact</span>
                <span>{sellerFacts.seller_contact || 'Unspecified'}</span>
              </div>
              {sellerFacts.allergens && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Allergen Declarations</span>
                  <span>{sellerFacts.allergens}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. REAL GEMMA AI OUTPUT */}
          <div className="bg-gradient-to-br from-orange-50/70 to-amber-50/70 rounded-2xl border border-orange-200 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-orange-950">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>2. Gemma 4 AI Response</span>
              </div>
              <span className="text-[10px] font-mono text-orange-800 bg-orange-100 px-2 py-0.5 rounded-md">
                Ollama / {gen.model || 'gemma4:e2b'}
              </span>
            </div>

            {gen.title && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">AI Generated Title</span>
                <p className="text-sm font-bold text-slate-900">{gen.title}</p>
              </div>
            )}

            {gen.summary && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Structured Summary</span>
                <p className="text-xs text-slate-700 leading-relaxed">{gen.summary}</p>
              </div>
            )}

            {tags.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Suggested Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t, idx) => (
                    <span key={idx} className="inline-flex items-center text-xs font-semibold bg-white text-orange-800 border border-orange-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                      <Tag className="w-3 h-3 mr-1 text-orange-500" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {gen.suggested_handling && (
              <div className="pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Suggested Redistribution Guidance</span>
                <p className="text-xs text-slate-700">{gen.suggested_handling}</p>
              </div>
            )}
          </div>

          {/* 3. CHECKLIST OF MISSING DETAILS */}
          {missingChecklist.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-950 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>3. Missing or Unverified Details Checklist</span>
              </div>
              <p className="text-[11px] text-amber-800 mb-2">
                Gemma AI flagged the following unverified or missing parameters to prevent food safety incidents:
              </p>
              <ul className="text-xs text-amber-900 space-y-1 list-disc pl-4">
                {missingChecklist.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. EDITABLE SHARING MESSAGE & COPY BUTTON */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Editable Generated Sharing Message</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={`text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-200'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Message'}</span>
              </button>
            </div>
            <textarea
              rows="6"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full font-mono text-xs p-3.5 rounded-2xl bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 leading-relaxed transition-all"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#faf6ee] px-6 py-4 border-t border-[#ebdcc0] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
          >
            Back to Edit
          </button>

          <button
            type="button"
            onClick={() => onConfirmPublish({
              ...rawForm,
              food_name: gen.title || rawForm.food_name,
              ai_insights: {
                title: gen.title,
                summary: gen.summary,
                suggested_tags: tags,
                suggested_handling: gen.suggested_handling,
                missing_details_checklist: missingChecklist,
                model: gen.model || 'gemma4:e2b',
                source: 'ollama_gemma4'
              },
              shareable_message: messageText
            })}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Publish Listing</span>
          </button>
        </div>

      </div>
    </div>
  );
}
