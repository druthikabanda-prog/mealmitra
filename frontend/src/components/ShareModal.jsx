import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageSquare, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function ShareModal({ listing, isOpen, onClose }) {
  if (!isOpen || !listing) return null;

  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // If listing has a pre-generated message, use it; otherwise build one
    const text = listing.shareable_message || `🚨 SURPLUS FOOD RESCUE ALERT 🚨\n\n🍱 Food: ${listing.food_name}\n📦 Quantity: ${listing.quantity} ${listing.unit || 'portions'}\n⏰ Prepared: ${listing.prep_time || 'See donor'}\n⏳ Deadline: ${listing.deadline}\n📍 Location: ${listing.location}\n❄️ Storage: ${listing.storage_details}\n📞 Contact: ${listing.seller_contact}\n\n⚠️ Safety Notice: MealMitra coordinates surplus information; receiver must inspect upon pickup.`;
    setMessageText(text);
    setCopied(false);
  }, [listing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = messageText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Surplus Food Rescue: ${listing.food_name}`);
    const body = encodeURIComponent(messageText);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-xl w-full border border-[#ebdcc0] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#faf6ee] px-6 py-4 border-b border-[#ebdcc0] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-orange-100 rounded-xl text-orange-700">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                Share Surplus Food Alert
              </h3>
              <p className="text-xs text-slate-600">
                Review, edit, and copy the formatted message to send to recipients.
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
        <div className="p-6 space-y-4">
          
          {/* Policy reassurance banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start space-x-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Zero Automatic Broadcasts:</span> You retain full privacy and control. MealMitra never sends messages automatically without your explicit action.
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Shareable Message Preview (Editable)
              </label>
              <span className="text-[11px] text-slate-500">
                Feel free to adjust details before copying
              </span>
            </div>
            <textarea
              rows="10"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full font-mono text-xs sm:text-sm p-4 rounded-2xl border border-slate-300 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 leading-relaxed transition-all"
            />
          </div>

          {/* Quick Share Triggers */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Share to WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleEmail}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Mail className="w-4 h-4 text-slate-600" />
              <span>Send via Email</span>
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-[#faf6ee] px-6 py-4 border-t border-[#ebdcc0] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all ${
              copied
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20 active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Shareable Message</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
