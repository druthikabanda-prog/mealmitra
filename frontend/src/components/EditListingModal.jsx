import React, { useState, useEffect } from 'react';
import { X, Check, Save, AlertCircle } from 'lucide-react';

export default function EditListingModal({ listing, isOpen, onClose, onSave }) {
  if (!isOpen || !listing) return null;

  const [formData, setFormData] = useState({
    food_name: '',
    quantity: '',
    unit: 'boxes',
    deadline: '',
    location: '',
    storage_details: '',
    seller_contact: '',
    allergens: '',
    status: 'available'
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (listing) {
      setFormData({
        food_name: listing.food_name || '',
        quantity: listing.quantity || '',
        unit: listing.unit || 'boxes',
        deadline: listing.deadline || '',
        location: listing.location || '',
        storage_details: listing.storage_details || '',
        seller_contact: listing.seller_contact || '',
        allergens: listing.allergens || '',
        status: listing.status || 'available'
      });
      setError('');
    }
  }, [listing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.food_name.trim() || !formData.quantity.trim() || !formData.location.trim()) {
      setError("Please fill in required fields: Food Name, Quantity, and Location.");
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(listing.id, formData);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update listing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full border border-[#ebdcc0] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#faf6ee] px-6 py-4 border-b border-[#ebdcc0] flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">
              Edit Surplus Food Listing
            </h3>
            <p className="text-xs text-slate-600">
              Update details before redistributing or sharing with partners.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Food Name
            </label>
            <input
              type="text"
              name="food_name"
              value={formData.food_name}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Quantity
              </label>
              <input
                type="text"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Pickup Deadline
            </label>
            <input
              type="text"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Pickup Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Storage Details
            </label>
            <textarea
              name="storage_details"
              rows="2"
              value={formData.storage_details}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Seller Contact
            </label>
            <input
              type="text"
              name="seller_contact"
              value={formData.seller_contact}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
