import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SafetyBanner from './components/SafetyBanner';
import AddFoodForm from './components/AddFoodForm';
import ListingCard from './components/ListingCard';
import ShareModal from './components/ShareModal';
import EditListingModal from './components/EditListingModal';
import DraftReviewModal from './components/DraftReviewModal';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ClaimModal from './components/ClaimModal';
import ImpactDashboard from './components/ImpactDashboard';
import UserDashboard from './components/UserDashboard';

import { 
  fetchHealth, 
  fetchListings, 
  generateListingDraft, 
  createListing, 
  updateListing, 
  deleteListing, 
  fetchMe,
  clearSession,
  getStoredUser,
  fetchNotifications
} from './services/api';

import { 
  saveCachedListings, 
  getCachedListings, 
  saveOfflineDraft, 
  getOfflineDrafts, 
  deleteOfflineDraft 
} from './services/offlineStorage';

import { 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HeartHandshake, 
  Layers, 
  ArrowUpRight,
  Filter,
  MapPin,
  Utensils,
  PlusCircle,
  Building,
  ShieldCheck,
  CloudOff,
  UploadCloud,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function App() {
  // Authentication & User State
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Connectivity & Offline PWA State
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [offlineDrafts, setOfflineDrafts] = useState([]);
  const [cachedTimestamp, setCachedTimestamp] = useState(null);
  const [isCachedFeed, setIsCachedFeed] = useState(false);

  // Active View Tab: 'available' | 'publish' | 'dashboard' | 'impact'
  const [activeTab, setActiveTab] = useState('available');

  // Listings & Data
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'available', 'urgent'
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Modals
  const [sharingListing, setSharingListing] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [activeDraft, setActiveDraft] = useState(null);
  const [rawDraftForm, setRawDraftForm] = useState(null);
  const [claimingListing, setClaimingListing] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Connectivity Listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Online connection restored! Reconnecting to live MealMitra network.");
      loadInitialData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast("Operating in MealMitra Offline Mode. Viewing cached listings.", "error");
      loadOfflineData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Offline Data Loader (IndexedDB)
  const loadOfflineData = async () => {
    const cached = await getCachedListings();
    if (cached.listings && cached.listings.length > 0) {
      setListings(cached.listings);
      setCachedTimestamp(cached.cachedAt);
      setIsCachedFeed(true);
    }
    const drafts = await getOfflineDrafts();
    setOfflineDrafts(drafts);
  };

  // Initial load
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, listingsData] = await Promise.all([
        fetchHealth(),
        fetchListings().catch(() => null)
      ]);
      setAiStatus(health.ollama || null);

      if (listingsData && listingsData.listings) {
        setListings(listingsData.listings);
        setIsCachedFeed(false);
        // Persist to IndexedDB cache
        await saveCachedListings(listingsData.listings);
      } else {
        await loadOfflineData();
      }

      // Load saved offline drafts from IndexedDB
      const drafts = await getOfflineDrafts();
      setOfflineDrafts(drafts);

      // Verify session token
      const me = await fetchMe().catch(() => null);
      if (me) {
        setCurrentUser(me);
        const notifs = await fetchNotifications().catch(() => []);
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.warn("Network error during initial load, loading offline cache:", err);
      await loadOfflineData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Auth Handlers
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.full_name}! Signed in to MealMitra.`);
    if (user.role === 'donor' && activeTab === 'publish') {
      // stay on publish
    } else {
      setActiveTab('dashboard');
    }
    fetchNotifications().then((notifs) => {
      setUnreadCount(notifs.filter((n) => !n.is_read).length);
    }).catch(() => {});
  };

  const handleRegisterSuccess = (user) => {
    setCurrentUser(user);
    showToast(`Welcome to MealMitra, ${user.full_name}!`);
    setActiveTab(user.role === 'donor' ? 'publish' : 'available');
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setActiveTab('available');
    showToast("You have been securely signed out of MealMitra.");
  };

  // Offline Draft Saving
  const handleSaveOfflineDraft = async (draftData) => {
    try {
      await saveOfflineDraft(draftData);
      const drafts = await getOfflineDrafts();
      setOfflineDrafts(drafts);
      showToast(`Saved Draft — Not Published. Stored locally in MealMitra IndexedDB.`);
    } catch (err) {
      showToast("Failed to save offline draft: " + err.message, "error");
    }
  };

  // Synchronize an offline draft
  const handleSyncDraft = async (draft) => {
    if (!isOnline) {
      showToast("Cannot publish while offline. Reconnect to publish to MealMitra.", "error");
      return;
    }
    if (!currentUser) {
      setIsLoginOpen(true);
      showToast("Please sign in as a Food Donor to publish this draft.", "error");
      return;
    }
    try {
      await createListing(draft);
      await deleteOfflineDraft(draft.id);
      const drafts = await getOfflineDrafts();
      setOfflineDrafts(drafts);
      showToast(`Draft "${draft.food_name}" successfully synced & published!`);
      loadInitialData();
    } catch (err) {
      showToast("Failed to sync draft: " + err.message, "error");
      throw err;
    }
  };

  // Gemma AI & Publishing Handlers
  const handleDraftGenerated = async (formData) => {
    const draft = await generateListingDraft(formData);
    setActiveDraft(draft);
    setRawDraftForm(formData);
    return draft;
  };

  const handleCreateListing = async (listingData) => {
    if (!isOnline) {
      await handleSaveOfflineDraft(listingData);
      return;
    }

    if (!currentUser) {
      setIsLoginOpen(true);
      showToast("Please sign in as a Food Donor to publish listings.", "error");
      return;
    }
    if (currentUser.role !== 'donor') {
      showToast("Only registered Food Donors can publish surplus food.", "error");
      return;
    }

    const created = await createListing(listingData);
    setListings((prev) => [created, ...prev]);
    showToast(`Surplus food "${listingData.food_name}" successfully published!`);
    loadInitialData();
    setActiveTab('available');
  };

  const handleConfirmDraftPublish = async (finalData) => {
    if (!isOnline) {
      await handleSaveOfflineDraft(finalData);
      setActiveDraft(null);
      setRawDraftForm(null);
      return;
    }

    if (!currentUser) {
      setIsLoginOpen(true);
      showToast("Please sign in to publish your verified draft.", "error");
      return;
    }
    try {
      await createListing(finalData);
      setActiveDraft(null);
      setRawDraftForm(null);
      showToast(`Listing "${finalData.food_name}" published to MealMitra!`);
      loadInitialData();
      setActiveTab('available');
    } catch (err) {
      showToast("Failed to publish: " + err.message, "error");
    }
  };

  const handleUpdateListing = async (id, updates) => {
    await updateListing(id, updates);
    setListings((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    showToast("Listing updated successfully!");
    loadInitialData();
  };

  const handleDeleteListing = async (id) => {
    if (window.confirm("Are you sure you want to delete this food listing?")) {
      await deleteListing(id);
      setListings((prev) => prev.filter((item) => item.id !== id));
      showToast("Listing removed.");
      loadInitialData();
    }
  };

  const handleStatusToggle = async (listing) => {
    const newStatus = listing.status === 'available' ? 'collected' : 'available';
    await updateListing(listing.id, { status: newStatus });
    setListings((prev) => prev.map((item) => (item.id === listing.id ? { ...item, status: newStatus } : item)));
    showToast(newStatus === 'collected' ? "Marked as collected." : "Reactivated to available.");
    loadInitialData();
  };

  // Claiming Handlers
  const handleInitiateClaim = (listing) => {
    if (!isOnline) {
      showToast("Cannot submit claims while offline. Server verification is required to prevent duplicate or unavailable claims.", "error");
      return;
    }
    if (!currentUser) {
      setIsLoginOpen(true);
      showToast("Please sign in as a recipient to request surplus food.", "error");
      return;
    }
    if (currentUser.role !== 'recipient') {
      showToast("You are logged in as a Food Donor. Switch to a recipient account to claim food.", "error");
      return;
    }
    setClaimingListing(listing);
  };

  const handleClaimSubmitted = (res) => {
    showToast("Claim request submitted! Awaiting donor confirmation.");
    loadInitialData();
    setActiveTab('dashboard');
  };

  // Filtered listings
  const filteredListings = listings.filter((item) => {
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'available' ? item.status === 'available' :
      filterStatus === 'urgent' ? item.is_urgent :
      true;

    const matchesSearch = 
      !searchQuery.trim() ||
      item.food_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.allergens?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storage_details?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = 
      !locationFilter.trim() ||
      item.location?.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesStatus && matchesSearch && matchesLocation;
  });

  const availableCount = listings.filter((item) => item.status === 'available').length;
  const urgentCount = listings.filter((item) => item.is_urgent).length;

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col selection:bg-orange-200 selection:text-orange-950">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center space-x-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold border ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-emerald-900 text-white border-emerald-800 shadow-emerald-950/20'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        ollamaStatus={aiStatus}
        onResetSamples={loadInitialData}
        isResetting={loading}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onLogout={handleLogout}
        unreadCount={unreadCount}
        isOnline={isOnline}
        offlineDraftsCount={offlineDrafts.length}
      />

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center space-x-2 border-b border-amber-600 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
          <span>⚠️ Offline Mode Active:</span>
          <span className="font-medium text-slate-950">
            {isCachedFeed && cachedTimestamp
              ? `Displaying cached food listings (saved ${new Date(cachedTimestamp).toLocaleTimeString()}). Live availability requires connection.`
              : 'New food listings will be saved locally as drafts in IndexedDB.'}
          </span>
          {offlineDrafts.length > 0 && (
            <span className="bg-slate-900 text-amber-300 px-2 py-0.5 rounded-full text-[11px] font-bold ml-1">
              {offlineDrafts.length} Unsynced Draft{offlineDrafts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Food Safety Banner */}
      <SafetyBanner />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* TAB 1: Available Food Feed */}
        {activeTab === 'available' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Hero Banner */}
            <section className="bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/60 text-emerald-200 border border-emerald-600/60 mb-3">
                  <HeartHandshake className="w-3.5 h-3.5 text-orange-400" />
                  <span>Rescue Food. Nourish Lives.</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display leading-tight text-white">
                  Rescue Food. Nourish Lives.
                </h1>
                <p className="text-sm sm:text-base text-emerald-100/90 mt-2 leading-relaxed">
                  MealMitra coordinates surplus food from commercial canteens, bakeries, and dining halls with food pantries and recipients. 
                  Surplus portions are organized with verified temperatures, collection deadlines, and local Gemma AI assistance.
                </p>

                {/* Call-to-action buttons */}
                <div className="mt-5 flex items-center space-x-3 flex-wrap gap-y-2">
                  {currentUser?.role === 'donor' ? (
                    <button
                      onClick={() => setActiveTab('publish')}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all flex items-center space-x-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Publish Surplus Food</span>
                    </button>
                  ) : !currentUser ? (
                    <>
                      <button
                        onClick={() => setIsRegisterOpen(true)}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all"
                      >
                        Join MealMitra
                      </button>
                      <button
                        onClick={() => setIsLoginOpen(true)}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                      >
                        Sign In
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                    >
                      View My Dashboard
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('impact')}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-emerald-100 hover:text-white underline underline-offset-4 transition-all"
                  >
                    View Real Impact Stats →
                  </button>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="mt-6 pt-6 border-t border-emerald-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-700/40">
                  <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
                    Available Items
                  </span>
                  <span className="text-2xl font-bold font-display text-white mt-0.5 block">
                    {availableCount}
                  </span>
                </div>

                <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-700/40">
                  <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
                    Urgent (&lt; 2h)
                  </span>
                  <span className="text-2xl font-bold font-display text-orange-400 mt-0.5 block">
                    {urgentCount}
                  </span>
                </div>

                <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-700/40">
                  <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
                    AI Intelligence
                  </span>
                  <span className="text-sm font-bold text-white mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    Local Gemma 4
                  </span>
                </div>

                <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-700/40">
                  <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
                    Offline Ready
                  </span>
                  <span className="text-sm font-bold text-white mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    PWA + IndexedDB
                  </span>
                </div>
              </div>
            </section>

            {/* Offline Cache Warning Pill (Never guarantee availability when offline) */}
            {isCachedFeed && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start space-x-3 shadow-xs">
                <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Offline Cache Notice:</strong> You are viewing previously fetched listings cached on {cachedTimestamp ? new Date(cachedTimestamp).toLocaleString() : 'this device'}. Availability is not guaranteed until reconnected to the server. Claims require active verification to prevent duplicate allocation.
                </div>
              </div>
            )}

            {/* Search, Filter, and Category Controls */}
            <div className="bg-white rounded-3xl border border-[#ebdcc0] p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                
                {/* Search query input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by food name, allergens, preparation notes..."
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Location Filter */}
                <div className="relative md:w-64">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Filter by location (e.g. Canteen)"
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center space-x-1 p-1 bg-[#faf6ee] rounded-xl border border-[#ebdcc0] self-start md:self-auto shrink-0">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterStatus === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({listings.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('available')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterStatus === 'available'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Available ({availableCount})
                  </button>
                  <button
                    onClick={() => setFilterStatus('urgent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterStatus === 'urgent'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Urgent ({urgentCount})
                  </button>
                </div>

              </div>
            </div>

            {/* Offline Drafts Banner in Feed (if any unsynced drafts exist) */}
            {offlineDrafts.length > 0 && (
              <div className="p-4 rounded-3xl bg-amber-50/80 border-2 border-dashed border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <CloudOff className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {offlineDrafts.length} Local Draft{offlineDrafts.length > 1 ? 's' : ''} Saved Offline
                    </h4>
                    <p className="text-xs text-slate-600">
                      Labeled as "Saved Draft — Not Published". Synchronize them to publish to the community.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-amber-200 hover:bg-amber-300 transition-colors self-start sm:self-auto"
                >
                  Review Offline Drafts →
                </button>
              </div>
            )}

            {/* Listings Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-bold font-display text-slate-900 flex items-center space-x-2">
                  <span>Available Surplus Food</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                    {filteredListings.length} found
                  </span>
                </h2>
                <span className="text-xs text-slate-500">
                  {isCachedFeed ? 'From local device cache' : 'Sorted by pickup deadline'}
                </span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="cream-card rounded-3xl p-6 animate-pulse space-y-4">
                      <div className="h-44 bg-slate-200 rounded-2xl w-full"></div>
                      <div className="h-5 bg-slate-200 rounded-lg w-2/3"></div>
                      <div className="h-16 bg-slate-100 rounded-2xl"></div>
                    </div>
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="cream-card rounded-3xl p-12 text-center space-y-3 border-dashed border-2 border-[#ebdcc0]">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center mx-auto">
                    <SlidersHorizontal className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">No food listings match your filters</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try clearing your search query or adjusting location filters.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setLocationFilter(''); setFilterStatus('all'); }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                  >
                    <span>Clear All Filters</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      currentUser={currentUser}
                      onClaim={handleInitiateClaim}
                      onShare={(item) => setSharingListing(item)}
                      onEdit={(item) => setEditingListing(item)}
                      onDelete={handleDeleteListing}
                      onStatusToggle={handleStatusToggle}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: Donor Publish Food */}
        {activeTab === 'publish' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {!currentUser ? (
              <div className="bg-white rounded-3xl border border-[#ebdcc0] p-8 text-center space-y-4">
                <Utensils className="w-12 h-12 text-orange-600 mx-auto" />
                <h2 className="text-2xl font-bold text-slate-900 font-display">
                  Donor Sign In Required
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Only authorized food donors (canteens, bakeries, campus kitchens) can publish surplus food listings.
                </p>
                <div className="flex justify-center space-x-3 pt-2">
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors"
                  >
                    Sign In as Food Donor
                  </button>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Join MealMitra
                  </button>
                </div>
              </div>
            ) : currentUser.role !== 'donor' ? (
              <div className="bg-white rounded-3xl border border-[#ebdcc0] p-8 text-center space-y-3">
                <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  Food Recipient Account Detected
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  You are signed in as a <strong>Food Recipient</strong>. To publish surplus food, please switch to a Food Donor account.
                </p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                >
                  Browse Available Food Feed
                </button>
              </div>
            ) : (
              <AddFoodForm
                onListingCreated={handleCreateListing}
                onDraftGenerated={handleDraftGenerated}
                isOnline={isOnline}
                onSaveOfflineDraft={handleSaveOfflineDraft}
              />
            )}
          </div>
        )}

        {/* TAB 3: User Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            {!currentUser ? (
              <div className="bg-white rounded-3xl border border-[#ebdcc0] p-8 text-center space-y-4 max-w-md mx-auto">
                <Building className="w-12 h-12 text-emerald-700 mx-auto" />
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  Sign In to Access Dashboard
                </h2>
                <p className="text-xs text-slate-600">
                  Log in to MealMitra to manage surplus listings, review requests, or track pickup claims.
                </p>
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-800 transition-colors"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <UserDashboard
                user={currentUser}
                onLogout={handleLogout}
                onEditListing={(item) => setEditingListing(item)}
                onShareListing={(item) => setSharingListing(item)}
                onSwitchToPublish={() => setActiveTab('publish')}
                onSyncDraft={handleSyncDraft}
                isOnline={isOnline}
              />
            )}
          </div>
        )}

        {/* TAB 4: Real Impact Dashboard */}
        {activeTab === 'impact' && (
          <div className="animate-fade-in">
            <ImpactDashboard />
          </div>
        )}

      </main>

      {/* Clean, Minimal Footer */}
      <footer className="mt-16 bg-[#faf6ee] border-t border-[#ebdcc0] py-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 font-display text-sm">MealMitra</span>
            <span>—</span>
            <span className="text-slate-600">Rescue Food. Nourish Lives.</span>
          </div>
          <div className="text-slate-500 text-center sm:text-right font-medium">
            © 2026 MealMitra. Rescue Food. Nourish Lives.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onOpenRegister={() => { setIsLoginOpen(false); setIsRegisterOpen(true); }}
        onOpenForgotPassword={() => { setIsLoginOpen(false); setIsForgotPasswordOpen(true); }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
        onOpenLogin={() => { setIsRegisterOpen(false); setIsLoginOpen(true); }}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onOpenLogin={() => { setIsForgotPasswordOpen(false); setIsLoginOpen(true); }}
      />

      <ClaimModal
        listing={claimingListing}
        isOpen={Boolean(claimingListing)}
        onClose={() => setClaimingListing(null)}
        onClaimSubmitted={handleClaimSubmitted}
      />

      <ShareModal
        listing={sharingListing}
        isOpen={Boolean(sharingListing)}
        onClose={() => setSharingListing(null)}
      />

      <EditListingModal
        listing={editingListing}
        isOpen={Boolean(editingListing)}
        onClose={() => setEditingListing(null)}
        onSave={handleUpdateListing}
      />

      <DraftReviewModal
        draft={activeDraft}
        rawForm={rawDraftForm}
        isOpen={Boolean(activeDraft)}
        onClose={() => setActiveDraft(null)}
        onConfirmPublish={handleConfirmDraftPublish}
      />

    </div>
  );
}
