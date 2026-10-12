import React, { useState } from 'react';
import { X, HeartHandshake, MapPin, Clock, Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { createClaim } from '../services/api';

export default function ClaimModal({ listing, isOpen, onClose, onClaimSubmitted }) {
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !listing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!quantity.trim()) {
      setError('Please specify the quantity you wish to claim.');
      return;
    }

    setLoading(true);
    try {
      const res = await createClaim({
        listing_id: listing.id,
        quantity_requested: quantity.trim(),
        message: message.trim()
      });
      onClaimSubmitted(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to submit claim request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#ebdcc0] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-900 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-1">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Food Rescue Claim Request</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display">{listing.food_name}</h2>
          <p className="text-xs text-emerald-100/80 mt-1">
            Total offered: <strong>{listing.quantity} {listing.unit}</strong> by {listing.donor_org || listing.donor_name || 'Donor'}
          </p>
        </div>

        {/* Listing Context Pill */}
        <div className="p-4 bg-emerald-50/60 border-b border-emerald-100/80 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span><strong>Location:</strong> {listing.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span><strong>Must pickup before:</strong> {new Date(listing.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Thermometer className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span><strong>Storage:</strong> {listing.storage_details}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Quantity Needed *
              </label>
              <button
                type="button"
                onClick={() => setQuantity(`${listing.quantity} ${listing.unit}`)}
                className="text-[11px] text-emerald-700 hover:underline font-medium"
              >
                Claim All ({listing.quantity} {listing.unit})
              </button>
            </div>
            <input
              type="text"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`e.g. 10 ${listing.unit || 'portions'}`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-900 outline-hidden"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Specify how many portions you or your organization can promptly transport and distribute.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message to Donor (Optional)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Bringing insulated cooler bags; arriving around 1:30 PM for campus pantry."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-900 outline-hidden resize-none"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900">
            <strong>Pickup Commitment:</strong> Upon donor approval, the portions are reserved for you. Please inspect temperature conditions upon arrival.
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 transition-all shadow-md shadow-emerald-700/20 flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Claim Request</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
