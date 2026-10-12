import React, { useState } from 'react';
import { 
  Sparkles, 
  Upload, 
  Clock, 
  MapPin, 
  Phone, 
  Thermometer, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Camera,
  FileText,
  Layers,
  HelpCircle,
  Cpu
} from 'lucide-react';
import VerificationChecklist from './VerificationChecklist';
import { uploadImage, checkVisionCapability } from '../services/api';

const CANTEEN_PRESETS = [
  {
    name: "Campus Canteen Hot Bowls",
    data: {
      food_name: "Warm Veggie Dal & Steamed Rice Meal Trays",
      quantity: "28",
      unit: "meal trays",
      prep_time: new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 16),
      deadline: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16),
      location: "Greenwood Campus Central Canteen, Loading Dock B (Ground Floor)",
      storage_details: "Insulated hot food warmer (>63°C). Packed in sealed recyclable trays.",
      seller_contact: "Chef Marcus / Campus Dining (Ph: 555-019-4821)",
      allergens: "Contains soy & mustard seeds; gluten-free.",
      photo_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
    }
  },
  {
    name: "Student Bakery Pastries",
    data: {
      food_name: "Fresh Croissants & Blueberry Scones",
      quantity: "16",
      unit: "boxes (2 per box)",
      prep_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString().slice(0, 16),
      deadline: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 16),
      location: "North Quad Bakery Kiosk, Student Center",
      storage_details: "Clean ambient bakery display case. Individually bagged in parchment paper.",
      seller_contact: "Elena Vance (Ext 4830 / bakehouse@greenwood.edu)",
      allergens: "Contains wheat, butter, eggs, milk. Nut-free.",
      photo_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
    }
  }
];

export default function AddFoodForm({ 
  onListingCreated, 
  onDraftGenerated, 
  isOnline = true, 
  onSaveOfflineDraft 
}) {
  const [formData, setFormData] = useState({
    food_name: '',
    quantity: '',
    unit: 'boxes',
    prep_time: '',
    deadline: '',
    location: '',
    storage_details: '',
    seller_contact: '',
    allergens: '',
    photo_url: ''
  });

  const [verification, setVerification] = useState({
    temperature_checked: false,
    clean_packaging: false,
    allergens_declared: false,
    seller_certified: false
  });

  const [photoPreview, setPhotoPreview] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [gemmaError, setGemmaError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (gemmaError) setGemmaError(null);
  };

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [visionNotice, setVisionNotice] = useState(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }
      setUploadingPhoto(true);
      setVisionNotice(null);

      // Local preview immediately
      const localPreviewUrl = URL.createObjectURL(file);
      setPhotoPreview(localPreviewUrl);

      try {
        const uploadRes = await uploadImage(file);
        if (uploadRes.photo_url) {
          setFormData((prev) => ({ ...prev, photo_url: uploadRes.photo_url }));
          setPhotoPreview(uploadRes.photo_url);
        }

        // Audit active model vision capability
        const visionRes = await checkVisionCapability();
        if (!visionRes.supported) {
          setVisionNotice(
            visionRes.message || 
            "Model 'gemma4:e2b' is a text-only language model without image input capability. Food details must be confirmed in the form."
          );
        }
      } catch (err) {
        console.warn("Persistent upload fallback:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
          setFormData((prev) => ({ ...prev, photo_url: reader.result }));
        };
        reader.readAsDataURL(file);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const removePhoto = () => {
    setPhotoPreview('');
    setVisionNotice(null);
    setFormData((prev) => ({ ...prev, photo_url: '' }));
  };

  const applyPreset = (preset) => {
    setFormData(preset.data);
    setPhotoPreview(preset.data.photo_url || '');
    setVerification({
      temperature_checked: true,
      clean_packaging: true,
      allergens_declared: true,
      seller_certified: true
    });
    setErrors({});
    setGemmaError(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.food_name.trim()) newErrors.food_name = "Food name is required";
    if (!formData.quantity.trim()) newErrors.quantity = "Quantity is required";
    if (!formData.prep_time.trim()) newErrors.prep_time = "Preparation time is required";
    if (!formData.deadline.trim()) newErrors.deadline = "Collection deadline is required";
    if (!formData.location.trim()) newErrors.location = "Pickup location is required";
    if (!formData.storage_details.trim()) newErrors.storage_details = "Storage details are required";
    if (!formData.seller_contact.trim()) newErrors.seller_contact = "Seller contact is required";

    if (!verification.seller_certified) {
      newErrors.verification = "You must confirm the safety checklist before submitting.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler for Generate with Gemma AI
  const handleGenerateAIDraft = async () => {
    if (!formData.food_name.trim()) {
      setErrors({ food_name: "Enter a food name to generate a structured listing with Gemma AI." });
      return;
    }
    setLoadingAI(true);
    setGemmaError(null);
    try {
      await onDraftGenerated({
        ...formData,
        verification
      });
    } catch (err) {
      setGemmaError({
        message: err.message || "Failed to generate listing with Gemma AI.",
        help: err.help || "Make sure Ollama is running at http://localhost:11434 with model 'gemma4:e2b' installed."
      });
    } finally {
      setLoadingAI(false);
    }
  };

  // Direct Submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setGemmaError(null);
    try {
      if (!isOnline && onSaveOfflineDraft) {
        await onSaveOfflineDraft({
          ...formData,
          verification
        });
      } else {
        await onListingCreated({
          ...formData,
          verification
        });
      }
      // Reset form after successful submission
      setFormData({
        food_name: '',
        quantity: '',
        unit: 'boxes',
        prep_time: '',
        deadline: '',
        location: '',
        storage_details: '',
        seller_contact: '',
        allergens: '',
        photo_url: ''
      });
      setVerification({
        temperature_checked: false,
        clean_packaging: false,
        allergens_declared: false,
        seller_certified: false
      });
      setPhotoPreview('');
      setVisionNotice(null);
    } catch (err) {
      setGemmaError({
        message: err.message || "Failed to create listing."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#ebdcc0] p-6 sm:p-8 shadow-sm">
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#ebdcc0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse"></span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              Add Surplus Food
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Register surplus portions for nearby reuse before quality degrades.
          </p>
        </div>

        {/* Demo Data Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Quick Fill Demo:</span>
          {CANTEEN_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Real Gemma AI Error Notification Banner (No mock fallback) */}
      {gemmaError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-900 space-y-1.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 font-bold text-red-950">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Gemma AI Integration Notice</span>
            </div>
            <button
              type="button"
              onClick={() => setGemmaError(null)}
              className="text-red-500 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-red-800 leading-relaxed font-medium">
            {gemmaError.message}
          </p>
          {gemmaError.help && (
            <div className="mt-2 p-2.5 bg-white/80 rounded-xl border border-red-200/80 text-[11px] text-slate-700">
              <span className="font-bold text-slate-900">How to resolve: </span>
              <span>{gemmaError.help}</span>
              <div className="mt-1 font-mono text-[11px] bg-slate-100 p-1 rounded text-slate-800">
                ollama run gemma4:e2b
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        
        {/* Field 1: Food Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            1. Food Name / Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="food_name"
            value={formData.food_name}
            onChange={handleChange}
            placeholder="e.g., Vegetable Pulao & Spiced Dal Meals, Assorted Muffins"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${
              errors.food_name ? 'border-red-400 bg-red-50/20' : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          />
          {errors.food_name && <p className="text-xs text-red-600 mt-1">{errors.food_name}</p>}
        </div>

        {/* Field 2: Quantity & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              2. Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g., 25, 10-15, 8.5"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${
                errors.quantity ? 'border-red-400 bg-red-50/20' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Unit
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="boxes">boxes</option>
              <option value="portions">portions</option>
              <option value="meal trays">meal trays</option>
              <option value="pieces">pieces / items</option>
              <option value="kg">kilograms (kg)</option>
              <option value="litres">litres (L)</option>
              <option value="packs">packs</option>
            </select>
          </div>
        </div>

        {/* Field 3 & 4: Preparation Date & Time, Collection Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              3. Preparation Date & Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                name="prep_time"
                value={formData.prep_time}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                  errors.prep_time ? 'border-red-400 bg-red-50/20' : 'border-slate-300 bg-white'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Exact time food was cooked or packed.</p>
            {errors.prep_time && <p className="text-xs text-red-600 mt-1">{errors.prep_time}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              4. Collection Deadline <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                  errors.deadline ? 'border-red-400 bg-red-50/20' : 'border-slate-300 bg-white'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Strict window after which food cannot be held.</p>
            {errors.deadline && <p className="text-xs text-red-600 mt-1">{errors.deadline}</p>}
          </div>
        </div>

        {/* Field 5: Pickup Location */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            5. Pickup Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Campus Central Canteen, Loading Dock B (Ground Floor)"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                errors.location ? 'border-red-400 bg-red-50/20' : 'border-slate-300 bg-white'
              }`}
            />
          </div>
          {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
        </div>

        {/* Field 6: Storage Details */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            6. Storage Details & Temperature History <span className="text-red-500">*</span>
          </label>
          <textarea
            name="storage_details"
            rows="2"
            value={formData.storage_details}
            onChange={handleChange}
            placeholder="e.g., Kept in hot catering warmer above 60°C. Clean food-grade containers with lids. Not held overnight."
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
              errors.storage_details ? 'border-red-400 bg-red-50/20' : 'border-slate-300 bg-white'
            }`}
          ></textarea>
          {errors.storage_details && <p className="text-xs text-red-600 mt-1">{errors.storage_details}</p>}
        </div>

        {/* Field 7: Seller Contact */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            7. Seller / Donor Contact Details <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="seller_contact"
            value={formData.seller_contact}
            onChange={handleChange}
            placeholder="e.g., Chef Marcus (Ph: 555-019-4821 / canteen@greenwood.edu)"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
              errors.seller_contact ? 'border-red-400 bg-red-50/20' : 'border-slate-300 bg-white'
            }`}
          />
          {errors.seller_contact && <p className="text-xs text-red-600 mt-1">{errors.seller_contact}</p>}
        </div>

        {/* Optional Allergens */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Known Allergens (Optional / Self-Reported)
          </label>
          <input
            type="text"
            name="allergens"
            value={formData.allergens}
            onChange={handleChange}
            placeholder="e.g., Contains dairy, gluten. Made in a facility with nuts."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          <p className="text-[11px] text-slate-500 mt-1">Gemma AI will strictly use what you write without inventing ingredients.</p>
        </div>

        {/* Field 8: Optional Food Photo Upload */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            8. Optional Food Photo (Visual Reference Only)
          </label>

          {photoPreview ? (
            <div className="relative inline-block rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-md">
              <img
                src={photoPreview}
                alt="Surplus Food Preview"
                className="w-48 h-36 object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] p-1 text-center font-medium">
                Photo attached
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#ebdcc0] hover:border-emerald-500 rounded-2xl bg-[#faf6ee]/50 hover:bg-emerald-50/30 cursor-pointer transition-all">
              <div className="p-3 bg-emerald-100/70 rounded-full text-emerald-700 mb-2">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Click or drag to upload food photo
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                PNG, JPG or WebP up to 4MB
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}

          {uploadingPhoto && (
            <div className="mt-2 text-xs text-emerald-800 flex items-center space-x-2 font-medium">
              <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>Saving photo persistently to server disk...</span>
            </div>
          )}

          {visionNotice && (
            <div className="mt-2 text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-start space-x-2">
              <Cpu className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>AI Model Capability:</strong> {visionNotice}
              </div>
            </div>
          )}

          {/* Photo Safety Policy Caveat */}
          <div className="mt-2 text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200/80 flex items-start space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Photo Policy:</strong> Photos cannot determine bacterial freshness or safety. Storage temperature and preparation records must be confirmed by the donor.
            </span>
          </div>
        </div>

        {/* Verification Checklist */}
        <VerificationChecklist
          values={verification}
          onChange={setVerification}
        />
        {errors.verification && (
          <p className="text-xs font-semibold text-red-600">{errors.verification}</p>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#ebdcc0] flex flex-col sm:flex-row gap-3">
          
          {/* Explicit Generate with Gemma AI button */}
          <button
            type="button"
            onClick={handleGenerateAIDraft}
            disabled={loadingAI}
            className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl font-semibold text-sm bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${loadingAI ? 'animate-spin' : ''}`} />
            <span>{loadingAI ? 'Contacting Gemma 4 AI via Ollama...' : 'Generate with Gemma AI'}</span>
          </button>

          {/* Direct Submit & Save button */}
          <button
            type="submit"
            disabled={submitting || !verification.seller_certified}
            className={`flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl font-semibold text-sm text-white shadow-md active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              !isOnline 
                ? 'bg-amber-700 hover:bg-amber-800 shadow-amber-800/20' 
                : 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
            <span>
              {submitting 
                ? 'Processing...' 
                : !isOnline 
                ? 'Save as Offline Draft (IndexedDB)' 
                : 'Save Surplus Listing'}
            </span>
          </button>

        </div>

      </form>
    </div>
  );
}
