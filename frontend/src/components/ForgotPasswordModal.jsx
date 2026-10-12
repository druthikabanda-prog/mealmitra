import React, { useState } from 'react';
import { X, KeyRound, Mail, CheckCircle2, ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import { forgotPassword, resetPassword } from '../services/api';

export default function ForgotPasswordModal({ isOpen, onClose, onOpenLogin }) {
  const [step, setStep] = useState(1); // 1: request code, 2: enter code & new password
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please provide your account email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword({ email: email.trim().toLowerCase() });
      if (res.token) {
        setToken(res.token);
      }
      setNotice(res.message);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Unable to generate password reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    if (!token.trim() || !newPassword) {
      setError('Reset token and new password are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        token: token.trim().toUpperCase(),
        new_password: newPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Password reset failed. Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#ebdcc0] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-900 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-1">
            <KeyRound className="w-3.5 h-3.5" />
            <span>MealMitra Account Security</span>
          </div>
          <h2 className="text-2xl font-bold font-display">Password Reset</h2>
          <p className="text-xs text-emerald-100/80 mt-1">
            {step === 1 ? "Enter your email to obtain a verified reset code." : "Set your new secure password."}
          </p>
        </div>

        <div className="p-6 sm:p-7 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Password Updated!</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Your password has been securely updated in the database. You can now log in with your new credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-800 transition-colors"
              >
                Go to Log In
              </button>
            </div>
          ) : step === 1 ? (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="donor@canteen.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <strong>Delivery Transparency:</strong> If SMTP is not actively configured in this local hackathon environment, the one-time reset code will be securely presented to you directly.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Request Reset Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {notice && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                  {notice}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">One-Time Reset Code</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="e.g. 7A8B9C0D1E2F"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-mono tracking-wider uppercase text-slate-900 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Min 6 characters)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? "Updating Password..." : "Save New Password"}
              </button>
            </form>
          )}

          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Back to Sign In
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
