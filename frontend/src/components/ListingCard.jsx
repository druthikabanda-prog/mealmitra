import React from 'react';
import { 
  Share2, 
  Edit3, 
  Trash2, 
  Clock, 
  MapPin, 
  Phone, 
  Thermometer, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle,
  CheckCircle,
  Tag,
  HeartHandshake,
  Building,
  Flame
} from 'lucide-react';

export default function ListingCard({ 
  listing, 
  currentUser,
  onClaim, 
  onShare, 
  onEdit, 
  onDelete, 
  onStatusToggle 
}) {
  const isAvailable = listing.status === 'available';
  const isRequested = listing.status === 'requested';
  const isCollected = listing.status === 'collected';
  const hasPhoto = Boolean(listing.photo_url);
  const isOwner = currentUser && (listing.donor_id === currentUser.id);
  const isRecipient = currentUser?.role === 'recipient';

  // Format dates nicely
  const formatTime = (isoStr) => {
    if (!isoStr) return 'Not recorded';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const aiInsights = listing.ai_insights || {};
  const tags = aiInsights.tags || aiInsights.suggested_tags || [];
  const handlingTip = aiInsights.suggested_handling;
  const missingItems = aiInsights.missing_details_checklist || [];

  return (
    <div className={`cream-card rounded-3xl overflow-hidden transition-all duration-200 hover:shadow-lg border flex flex-col justify-between ${
      listing.is_urgent
        ? 'border-orange-400 ring-2 ring-orange-400/20 shadow-md'
        : isAvailable
        ? 'border-[#ebdcc0]'
        : 'border-slate-300 opacity-85'
    }`}>
      
      <div>
        {/* Photo and Status Overlay */}
        {hasPhoto ? (
          <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
            <img
              src={listing.photo_url}
              alt={listing.food_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-black/20 to-transparent" />
            
            <div className="absolute top-3 right-3 flex items-center space-x-1.5">
              {listing.is_urgent && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-red-600 text-white shadow-sm flex items-center space-x-1 animate-pulse">
                  <Flame className="w-3 h-3" />
                  <span>Urgent Pickup</span>
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm ${
                isAvailable 
                  ? 'bg-emerald-600 text-white' 
                  : isRequested
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-100'
              }`}>
                {isAvailable ? '● Available' : isRequested ? '● Claim Pending' : 'Collected'}
              </span>
            </div>

            <div className="absolute bottom-3 left-4 right-4">
              <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider flex items-center space-x-1">
                <span>{listing.donor_org || listing.donor_name || 'MealMitra Donor'}</span>
              </div>
              <h3 className="text-xl font-bold text-white font-display leading-tight truncate">
                {listing.food_name}
              </h3>
            </div>
          </div>
        ) : (
          <div className="p-5 pb-0 flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                {listing.donor_org || listing.donor_name || 'Surplus Food Listing'}
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display mt-0.5">
                {listing.food_name}
              </h3>
            </div>
            <div className="flex items-center space-x-1.5">
              {listing.is_urgent && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-600 text-white animate-pulse">
                  Urgent
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isAvailable 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : isRequested
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {isAvailable ? '● Available' : isRequested ? '● Pending' : 'Collected'}
              </span>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="p-5 space-y-4">
          
          {/* Key Metrics: Quantity & Timelines */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#faf6ee] border border-[#ebdcc0] text-xs">
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Quantity
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {listing.quantity} {listing.unit || 'portions'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Pickup Deadline
              </span>
              <span className={`font-bold text-sm flex items-center gap-1 ${listing.is_urgent ? 'text-red-600' : 'text-orange-700'}`}>
                <Clock className="w-3.5 h-3.5" />
                {formatTime(listing.deadline)}
              </span>
            </div>
          </div>

          {/* Location & Organization */}
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span className="font-medium text-slate-900">{listing.location}</span>
            </div>
            <div className="flex items-start space-x-2">
              <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>Donor: <strong>{listing.donor_name}</strong> {listing.donor_org ? `(${listing.donor_org})` : ''}</span>
            </div>
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span className="text-slate-500">Prepared at: {formatTime(listing.prep_time)}</span>
            </div>
          </div>

          {/* SELLER-CONFIRMED FACTS */}
          <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Donor Confirmed Handling</span>
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <p>
                <strong className="text-slate-800">Storage condition:</strong> {listing.storage_details}
              </p>
              {listing.allergens && (
                <p>
                  <strong className="text-slate-800">Known allergens:</strong> {listing.allergens}
                </p>
              )}
              {listing.notes && (
                <p className="text-slate-600 italic">
                  <strong>Notes:</strong> {listing.notes}
                </p>
              )}
            </div>
          </div>

          {/* AI-ASSISTED SUGGESTIONS */}
          {(tags.length > 0 || handlingTip) && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50/70 to-amber-50/70 border border-orange-200">
              <div className="flex items-center justify-between text-xs font-bold text-orange-950 mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>AI Assisted Suggestions</span>
                </div>
                <span className="text-[10px] font-semibold text-orange-800 bg-orange-100/90 px-1.5 py-0.5 rounded">
                  Gemma 4
                </span>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center text-[10px] font-semibold bg-white/90 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-md"
                    >
                      <Tag className="w-2.5 h-2.5 mr-1 text-orange-500" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {handlingTip && (
                <p className="text-xs text-slate-700">
                  <strong className="text-orange-950">Suggested handling:</strong> {handlingTip}
                </p>
              )}
            </div>
          )}

          {/* Missing Safety Checklist items */}
          {missingItems.length > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <div className="flex items-center space-x-1 font-semibold text-amber-950">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Safety Checklist Items:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                {missingItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3.5 bg-[#faf6ee] border-t border-[#ebdcc0] flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center space-x-1.5">
          
          {/* Recipient Claim Button */}
          {isAvailable && (
            <button
              type="button"
              onClick={() => onClaim(listing)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Claim / Request</span>
            </button>
          )}

          {/* Donor Owner Controls */}
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => onStatusToggle(listing)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
              >
                {isAvailable ? 'Mark Done' : 'Reactivate'}
              </button>
              
              <button
                type="button"
                onClick={() => onEdit(listing)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-300"
                title="Edit Listing"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onDelete(listing.id)}
                className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 border border-transparent hover:border-red-200"
                title="Delete Listing"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={() => onShare(listing)}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-900 bg-orange-100/80 hover:bg-orange-200/80 border border-orange-200 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5 text-orange-700" />
          <span>Share</span>
        </button>
      </div>

    </div>
  );
}
