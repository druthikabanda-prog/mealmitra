import React, { useState } from 'react';
import { 
  Utensils, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Cpu, 
  User, 
  LogIn, 
  LogOut, 
  Bell, 
  PlusCircle, 
  BarChart3, 
  HeartHandshake, 
  LayoutDashboard 
} from 'lucide-react';

export default function Navbar({ 
  user, 
  activeTab, 
  onSelectTab, 
  ollamaStatus, 
  onResetSamples, 
  isResetting,
  onOpenLogin, 
  onOpenRegister, 
  onLogout,
  unreadCount = 0,
  isOnline = true,
  offlineDraftsCount = 0
}) {
  const isConnected = Boolean(ollamaStatus?.connected);
  const isModelReady = Boolean(ollamaStatus?.model_available);
  const modelName = ollamaStatus?.model || 'gemma4:e2b';

  return (
    <header className="sticky top-0 z-30 bg-[#faf6ee]/95 backdrop-blur-md border-b border-[#ebdcc0] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Tagline */}
          <div 
            onClick={() => onSelectTab('available')}
            className="flex items-center space-x-3.5 cursor-pointer select-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 ring-2 ring-emerald-500/20">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-2xl tracking-tight text-slate-900">
                  Meal<span className="text-orange-600">Mitra</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Surplus Rescue
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-600 font-medium">
                Rescue Food. Nourish Lives.
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-white/70 p-1.5 rounded-2xl border border-[#ebdcc0]/80 shadow-xs">
            <button
              onClick={() => onSelectTab('available')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'available'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Available Food
            </button>

            <button
              onClick={() => onSelectTab('impact')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'impact'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Impact Stats
            </button>

            {user?.role === 'donor' && (
              <button
                onClick={() => onSelectTab('publish')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'publish'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-orange-700 hover:bg-orange-50'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Publish Food</span>
              </button>
            )}

            {user && (
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>My Dashboard</span>
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                )}
              </button>
            )}
          </nav>

          {/* Right Area: Connectivity, AI Badge & Auth buttons */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Online / Offline Connectivity Indicator */}
            <div 
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold shadow-2xs transition-colors ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
              }`}
              title={isOnline ? "Online: Connected to server" : "Offline: Running with local caches and offline drafts"}
            >
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-600'}`} />
              <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
            </div>

            {/* Offline Drafts Count Pill */}
            {offlineDraftsCount > 0 && (
              <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-xl text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300">
                {offlineDraftsCount} Saved Draft{offlineDraftsCount > 1 ? 's' : ''}
              </span>
            )}

            {/* Real Ollama Gemma 4 Status Badge */}
            <div 
              className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-colors ${
                isConnected && isModelReady
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : isConnected
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-red-50/80 border-red-200 text-red-900'
              }`}
              title={ollamaStatus?.message || `Ollama at ${ollamaStatus?.host || 'http://localhost:11434'}`}
            >
              <div className={`w-2 h-2 rounded-full ${
                isConnected && isModelReady 
                  ? 'bg-emerald-500 animate-pulse' 
                  : isConnected 
                  ? 'bg-amber-500' 
                  : 'bg-red-400'
              }`} />
              <Cpu className="w-3 h-3 text-slate-600" />
              <span>
                {isConnected && isModelReady
                  ? `Gemma 4 AI (${modelName})`
                  : isConnected
                  ? `Ollama Online (${modelName})`
                  : `Ollama Offline`}
              </span>
            </div>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold shadow-xs"
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                    user.role === 'donor' ? 'bg-orange-600' : 'bg-emerald-700'
                  }`}>
                    {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.full_name}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${
                    user.role === 'donor' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {user.role}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenLogin}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-xs"
                >
                  Log In
                </button>
                <button
                  onClick={onOpenRegister}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 transition-all shadow-sm shadow-emerald-700/20"
                >
                  Sign Up
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-[#ebdcc0]/60 text-xs font-bold text-slate-600">
          <button
            onClick={() => onSelectTab('available')}
            className={`py-1 px-2 rounded-lg ${activeTab === 'available' ? 'text-slate-900 font-extrabold underline' : ''}`}
          >
            Available Food
          </button>
          <button
            onClick={() => onSelectTab('impact')}
            className={`py-1 px-2 rounded-lg ${activeTab === 'impact' ? 'text-slate-900 font-extrabold underline' : ''}`}
          >
            Impact Stats
          </button>
          {user?.role === 'donor' && (
            <button
              onClick={() => onSelectTab('publish')}
              className={`py-1 px-2 rounded-lg text-orange-700 ${activeTab === 'publish' ? 'font-extrabold underline' : ''}`}
            >
              Publish Food
            </button>
          )}
          {user && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`py-1 px-2 rounded-lg text-emerald-800 ${activeTab === 'dashboard' ? 'font-extrabold underline' : ''}`}
            >
              Dashboard
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
