import React, { useState } from 'react';
import { X, Lock, Mail, Eye, EyeOff, LogIn, Sparkles, UserCheck, ShieldAlert } from 'lucide-react';
import { login } from '../services/api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, onOpenRegister, onOpenForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login({ email: email.trim().toLowerCase(), password });
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPwd) => {
    setEmail(demoEmail);
    setPassword(demoPwd);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#ebdcc0] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-900 px-6 py-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure Authentication</span>
          </div>
          <h2 className="text-2xl font-bold font-display">Sign In to MealMitra</h2>
          <p className="text-xs text-emerald-100/80 mt-1">
            Rescue Food. Nourish Lives. Coordinate surplus food or submit rescue requests.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          {/* Quick Demo Fill Buttons */}
          <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200/80">
            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Hackathon Demo Fast-Login:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('vinnethvarma9@gmail.com', 'Bangarm@2')}
                className="px-2 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-[11px] font-semibold text-emerald-900 transition-colors text-left flex flex-col shadow-xs"
              >
                <span className="text-emerald-700 font-bold truncate">Vinneth Varma</span>
                <span className="text-[10px] text-slate-500">Your Account</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('donor@canteen.edu', 'Password123!')}
                className="px-2 py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-amber-200 text-[11px] font-semibold text-amber-900 transition-colors text-left flex flex-col shadow-xs"
              >
                <span className="text-orange-700 font-bold truncate">Chef Marcus</span>
                <span className="text-[10px] text-slate-500">Demo Donor</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('recipient@foodbank.org', 'Password123!')}
                className="px-2 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-amber-200 text-[11px] font-semibold text-amber-900 transition-colors text-left flex flex-col shadow-xs"
              >
                <span className="text-emerald-700 font-bold truncate">Sarah</span>
                <span className="text-[10px] text-slate-500">Demo Recipient</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@canteen.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-900 transition-all outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={onOpenForgotPassword}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-900 transition-all outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 active:scale-[0.99] shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center border-t border-slate-100">
            <span className="text-xs text-slate-500">Don't have an account yet? </span>
            <button
              type="button"
              onClick={onOpenRegister}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline ml-1"
            >
              Sign Up here
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
