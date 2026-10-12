import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  Utensils, 
  HeartHandshake, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  PackageCheck, 
  Bell, 
  RefreshCw,
  LogOut,
  MapPin,
  Calendar,
  Share2,
  CloudOff,
  UploadCloud
} from 'lucide-react';
import { 
  fetchDonorListings, 
  fetchRecipientClaims, 
  updateClaimStatus, 
  cancelClaim,
  deleteListing,
  fetchNotifications,
  markNotificationRead
} from '../services/api';
import { getOfflineDrafts, deleteOfflineDraft } from '../services/offlineStorage';

export default function UserDashboard({ 
  user, 
  onLogout, 
  onEditListing, 
  onShareListing, 
  onSwitchToPublish,
  onSyncDraft,
  isOnline = true
}) {
  const isDonor = user?.role === 'donor';
  const [activeTab, setActiveTab] = useState(isDonor ? 'listings' : 'claims');
  
  // Data states
  const [donorListings, setDonorListings] = useState([]);
  const [recipientClaims, setRecipientClaims] = useState([]);
  const [offlineDrafts, setOfflineDrafts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      if (isDonor) {
        const listings = await fetchDonorListings().catch(() => []);
        setDonorListings(listings);
      } else {
        const claims = await fetchRecipientClaims().catch(() => []);
        setRecipientClaims(claims);
      }
      const notifs = await fetchNotifications().catch(() => []);
      setNotifications(notifs);

      const drafts = await getOfflineDrafts();
      setOfflineDrafts(drafts);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishOfflineDraft = async (draft) => {
    if (!isOnline) {
      alert("You are currently offline. Connect to the internet to publish this draft to MealMitra.");
      return;
    }
    if (!window.confirm(`Confirm publishing "${draft.food_name}" to MealMitra live network?`)) return;
    try {
      await onSyncDraft(draft);
      await deleteOfflineDraft(draft.id);
      await loadData();
    } catch (err) {
      alert("Failed to sync draft: " + err.message);
    }
  };

  const handleDeleteOfflineDraft = async (draftId) => {
    if (!window.confirm("Remove this saved offline draft?")) return;
    await deleteOfflineDraft(draftId);
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleClaimStatusChange = async (claimId, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [claimId]: true }));
    try {
      await updateClaimStatus(claimId, newStatus);
      await loadData();
    } catch (err) {
      alert("Failed to update claim: " + err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [claimId]: false }));
    }
  };

  const handleCancelClaim = async (claimId) => {
    if (!window.confirm("Are you sure you want to cancel this claim request?")) return;
    setActionLoading((prev) => ({ ...prev, [claimId]: true }));
    try {
      await cancelClaim(claimId);
      await loadData();
    } catch (err) {
      alert("Failed to cancel claim: " + err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [claimId]: false }));
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this food listing?")) return;
    try {
      await deleteListing(listingId);
      await loadData();
    } catch (err) {
      alert("Failed to delete listing: " + err.message);
    }
  };

  const handleMarkRead = async (notifId) => {
    await markNotificationRead(notifId);
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, is_read: 1 } : n)));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* User Profile Header Card */}
      <div className="bg-white rounded-3xl border border-[#ebdcc0] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md ${
              isDonor 
                ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20' 
                : 'bg-gradient-to-br from-emerald-600 to-green-700 shadow-emerald-600/20'
            }`}>
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 font-display">
                  {user?.full_name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isDonor 
                    ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isDonor ? 'Food Donor (Kitchen)' : 'Food Recipient (Pantry)'}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-slate-600 mt-2 flex-wrap gap-y-1">
                <span className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user?.email}</span>
                </span>
                {user?.organization && (
                  <span className="flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.organization}</span>
                  </span>
                )}
                {user?.phone && (
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto">
            {isDonor && (
              <button
                onClick={onSwitchToPublish}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-sm transition-all"
              >
                + Publish New Food
              </button>
            )}
            <button
              onClick={onLogout}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center space-x-2 mt-6 pt-6 border-t border-slate-100 overflow-x-auto">
          {isDonor ? (
            <>
              <button
                onClick={() => setActiveTab('listings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  activeTab === 'listings'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                My Food Listings ({donorListings.length})
              </button>
              <button
                onClick={() => setActiveTab('incoming_claims')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  activeTab === 'incoming_claims'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Incoming Claim Requests ({donorListings.flatMap(l => l.claims || []).length})
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('claims')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'claims'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              My Food Claims ({recipientClaims.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('offline_drafts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'offline_drafts'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CloudOff className="w-3.5 h-3.5" />
            <span>Saved Offline Drafts</span>
            {offlineDrafts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
                {offlineDrafts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'notifications'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>In-App Notifications</span>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-500" />
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white rounded-3xl border border-[#ebdcc0] p-6 sm:p-8 shadow-sm">
        
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isDonor && activeTab === 'listings' ? (
          
          /* Donor: My Food Listings */
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 font-display">
                My Food Listings
              </h2>
              <button
                onClick={loadData}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {donorListings.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                You haven't published any surplus food listings yet.
                <div className="mt-3">
                  <button
                    onClick={onSwitchToPublish}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700"
                  >
                    Publish First Food Listing
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {donorListings.map((item) => {
                  const claims = item.claims || [];
                  const pendingClaims = claims.filter(c => c.status === 'requested');
                  const confirmedClaims = claims.filter(c => c.status === 'confirmed');

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all bg-white shadow-xs"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2.5 flex-wrap">
                            <h3 className="font-bold text-base text-slate-900">{item.food_name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              item.status === 'available'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : item.status === 'requested'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : item.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}>
                              {item.status}
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              {item.quantity} {item.unit}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{item.location}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Pickup by: {new Date(item.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </span>
                          </div>
                        </div>

                        {/* Donor Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onShareListing(item)}
                            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200"
                            title="Share alert"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditListing(item)}
                            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200"
                            title="Edit details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteListing(item.id)}
                            className="p-2 rounded-xl text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200"
                            title="Delete listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Attached Claim Requests Accordion */}
                      {claims.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Incoming Claims ({claims.length}):
                          </div>
                          <div className="space-y-2">
                            {claims.map((claim) => (
                              <div
                                key={claim.id}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                              >
                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {claim.recipient_name} ({claim.recipient_org || 'Individual'}) requested <strong>{claim.quantity_requested}</strong>
                                  </div>
                                  {claim.message && (
                                    <div className="text-slate-600 text-[11px] mt-0.5 italic">
                                      "{claim.message}"
                                    </div>
                                  )}
                                  <div className="text-[10px] text-slate-400 mt-1">
                                    Status: <strong className="uppercase">{claim.status}</strong> • Tel: {claim.recipient_phone || 'N/A'}
                                  </div>
                                </div>

                                {/* Donor decision buttons */}
                                <div className="flex items-center space-x-2 shrink-0">
                                  {claim.status === 'requested' && (
                                    <>
                                      <button
                                        onClick={() => handleClaimStatusChange(claim.id, 'confirmed')}
                                        disabled={actionLoading[claim.id]}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleClaimStatusChange(claim.id, 'rejected')}
                                        disabled={actionLoading[claim.id]}
                                        className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-700 font-bold text-[11px]"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {claim.status === 'confirmed' && (
                                    <button
                                      onClick={() => handleClaimStatusChange(claim.id, 'collected')}
                                      disabled={actionLoading[claim.id]}
                                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center space-x-1"
                                    >
                                      <PackageCheck className="w-3.5 h-3.5" />
                                      <span>Mark Collected</span>
                                    </button>
                                  )}
                                  {claim.status === 'collected' && (
                                    <span className="text-emerald-700 font-bold flex items-center space-x-1">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Rescued & Collected</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        ) : isDonor && activeTab === 'incoming_claims' ? (

          /* Donor: All Incoming Claims Tab */
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display mb-4">
              All Incoming Claim Requests
            </h2>
            {donorListings.flatMap(l => (l.claims || []).map(c => ({ ...c, food_name: l.food_name }))).length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No claim requests have been submitted yet for your listings.
              </div>
            ) : (
              <div className="space-y-3">
                {donorListings.flatMap(l => (l.claims || []).map(c => ({ ...c, food_name: l.food_name }))).map((claim) => (
                  <div
                    key={claim.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{claim.food_name}</div>
                      <div className="text-slate-700 mt-1">
                        Requested by: <strong>{claim.recipient_name}</strong> ({claim.recipient_org || 'Recipient'})
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        Amount: <strong>{claim.quantity_requested}</strong>
                      </div>
                      {claim.message && <p className="text-slate-500 italic mt-1">"{claim.message}"</p>}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {claim.status === 'requested' && (
                        <>
                          <button
                            onClick={() => handleClaimStatusChange(claim.id, 'confirmed')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleClaimStatusChange(claim.id, 'rejected')}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-100 hover:text-red-700 text-slate-700 font-bold text-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {claim.status === 'confirmed' && (
                        <button
                          onClick={() => handleClaimStatusChange(claim.id, 'collected')}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Mark Collected</span>
                        </button>
                      )}
                      {claim.status === 'collected' && (
                        <span className="text-emerald-700 font-bold text-xs flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Rescue Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : !isDonor && activeTab === 'claims' ? (

          /* Recipient: My Claim Requests */
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 font-display">
                My Claim Requests
              </h2>
              <button
                onClick={loadData}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {recipientClaims.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                You haven't requested any food yet. Browse "Available Food" to find surplus meals.
              </div>
            ) : (
              <div className="space-y-4">
                {recipientClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2.5 flex-wrap">
                          <h3 className="font-bold text-base text-slate-900">{claim.food_name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            claim.status === 'requested'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : claim.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : claim.status === 'collected'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {claim.status === 'confirmed' ? 'Approved & Ready for Pickup' : claim.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700">
                          Requested Quantity: <strong>{claim.quantity_requested}</strong> (of {claim.total_quantity} {claim.unit})
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-slate-500 flex-wrap pt-1">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>Pickup Location: <strong>{claim.location}</strong></span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Deadline: {new Date(claim.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 pt-1">
                          <strong>Donor Contact:</strong> {claim.donor_name} ({claim.donor_org || 'Kitchen'}) • Tel: {claim.donor_phone || 'See location'}
                        </div>
                      </div>

                      {/* Recipient status or cancel action */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {claim.status === 'requested' && (
                          <button
                            onClick={() => handleCancelClaim(claim.id)}
                            disabled={actionLoading[claim.id]}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            Cancel Request
                          </button>
                        )}
                        {claim.status === 'confirmed' && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                            Ready for pickup! Please coordinate arrival.
                          </div>
                        )}
                        {claim.status === 'collected' && (
                          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            <span>Rescued Successfully</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : activeTab === 'offline_drafts' ? (

          /* Offline Drafts Tab */
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display flex items-center space-x-2">
                  <span>Saved Offline Drafts</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                    {offlineDrafts.length} Local Draft{offlineDrafts.length !== 1 ? 's' : ''}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Food listings created while offline. Stored in IndexedDB and not yet visible to the public.
                </p>
              </div>
              <button
                onClick={loadData}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {offlineDrafts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No offline drafts saved on this device. When offline, listings you prepare will automatically be saved here.
              </div>
            ) : (
              <div className="space-y-4">
                {offlineDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2.5 flex-wrap">
                          <h3 className="font-bold text-base text-slate-900">{draft.food_name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                            Saved Draft — Not Published
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            {draft.quantity} {draft.unit}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-slate-600 flex-wrap pt-1">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Location: {draft.location}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Deadline: {draft.deadline}</span>
                          </span>
                        </div>

                        <div className="text-xs text-slate-600">
                          <strong>Storage:</strong> {draft.storage_details}
                        </div>
                        {draft.allergens && (
                          <div className="text-xs text-slate-600">
                            <strong>Allergens:</strong> {draft.allergens}
                          </div>
                        )}
                        <p className="text-[11px] text-amber-800 italic pt-1">
                          * Saved offline in IndexedDB on {new Date(draft.created_at).toLocaleString()}. Not published until synced.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handlePublishOfflineDraft(draft)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs flex items-center space-x-1.5"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>Sync & Publish to MealMitra</span>
                        </button>
                        <button
                          onClick={() => handleDeleteOfflineDraft(draft.id)}
                          className="p-2 rounded-xl text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 transition-colors border border-red-200"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : (

          /* Notifications Tab */
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Notifications
              </h2>
              <button
                onClick={loadData}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 text-xs ${
                      n.is_read
                        ? 'bg-white border-slate-200 text-slate-700'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <Bell className={`w-4 h-4 mt-0.5 shrink-0 ${n.is_read ? 'text-slate-400' : 'text-emerald-700'}`} />
                      <div>
                        <div className="font-bold">{n.title}</div>
                        <p className="mt-0.5 text-slate-600">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-[11px] text-emerald-700 hover:underline shrink-0 font-bold"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
