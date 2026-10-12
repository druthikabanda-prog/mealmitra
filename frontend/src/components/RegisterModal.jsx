import React, { useState } from 'react';
import { X, Lock, Mail, User, Building, Phone, Eye, EyeOff, UserPlus, HeartHandshake, Utensils, ShieldAlert } from 'lucide-react';
import { register } from '../services/api';

export default function RegisterModal({ isOpen, onClose, onRegisterSuccess, onOpenLogin }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'donor', // 'donor' or 'recipient'
    organization: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password) {
      setError('Full name, email address, and password are required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await register({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        organization: formData.organization.trim(),
        phone: formData.phone.trim()
      });
      onRegisterSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed. An account may already exist with this email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#ebdcc0] overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-900 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-1">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create MealMitra Account</span>
          </div>
          <h2 className="text-2xl font-bold font-display">Join MealMitra</h2>
          <p className="text-xs text-emerald-100/80 mt-1">
            Rescue Food. Nourish Lives. Connect surplus kitchens with community pantries and recipients.
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

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Role:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, role: 'donor' }))}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col space-y-1.5 ${
                  formData.role === 'donor'
                    ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2 text-orange-700 font-bold text-sm">
                  <Utensils className="w-4 h-4 text-orange-600" />
                  <span>Food Donor</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Canteens, bakeries, restaurants offering surplus food.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, role: 'recipient' }))}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col space-y-1.5 ${
                  formData.role === 'recipient'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <span>Food Recipient</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Student pantries, shelters, individuals requesting food.
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Chef Marcus"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="marcus@canteen.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / Department</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="Campus Dining Hall"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 555-019-4821"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirm_password"
                  required
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900 outline-hidden"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 active:scale-[0.99] shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Complete Registration</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center border-t border-slate-100">
            <span className="text-xs text-slate-500">Already registered? </span>
            <button
              type="button"
              onClick={onOpenLogin}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline ml-1"
            >
              Sign In here
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
