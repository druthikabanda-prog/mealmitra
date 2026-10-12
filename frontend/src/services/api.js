/**
 * FoodRescue AI - Complete Frontend API Client.
 * Handles JWT authentication, persistent image uploads, donor listings,
 * claim workflows, real-time notifications, Gemma 4 AI generation, and impact stats.
 */

const API_BASE = '/api';

// Token storage key
const TOKEN_KEY = 'foodrescue_jwt_token';
const USER_KEY = 'foodrescue_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getAuthHeaders(includeJson = true) {
  const headers = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// =============================================================================
// Health & Ollama Readiness
// =============================================================================

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed (${res.status})`);
    return await res.json();
  } catch (err) {
    console.warn('API health check error:', err);
    return {
      status: 'offline',
      ollama: {
        status: 'offline',
        host: 'http://localhost:11434',
        model: 'gemma4:e2b',
        message: 'Backend server unreachable. Verify Flask is running on port 5000.'
      }
    };
  }
}

// =============================================================================
// Authentication Endpoints
// =============================================================================

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Login failed. Please check your credentials.');
  }
  setSession(data.token, data.user);
  return data;
}

export async function register({ full_name, email, password, role, organization, phone }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, password, role, organization, phone })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed. Please check your inputs.');
  }
  setSession(data.token, data.user);
  return data;
}

export async function fetchMe() {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    clearSession();
    return null;
  }
  const data = await res.json();
  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
  return data.user;
}

export async function forgotPassword({ email }) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to process password reset request.');
  }
  return data;
}

export async function resetPassword({ email, token, new_password }) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, new_password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Password reset failed. Invalid or expired token.');
  }
  return data;
}

// =============================================================================
// Persistent Image Upload
// =============================================================================

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/upload-image`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: formData
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload food photo.');
  }
  return data;
}

export async function checkVisionCapability() {
  const res = await fetch(`${API_BASE}/analyze-photo`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return await res.json().catch(() => ({ supported: false }));
}

// =============================================================================
// Gemma 4 AI Listing Generation
// =============================================================================

export async function generateListingDraft(payload) {
  const res = await fetch(`${API_BASE}/generate-listing`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || `Gemma AI generation failed (${res.status})`;
    const errorObj = new Error(errorMsg);
    errorObj.help = data.help;
    errorObj.code = data.code;
    errorObj.host = data.host;
    errorObj.model = data.model;
    throw errorObj;
  }
  return data;
}

// =============================================================================
// Food Listings Endpoints
// =============================================================================

export async function fetchListings(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.location) params.set('location', filters.location);
  if (filters.status) params.set('status', filters.status);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/listings${queryString}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to fetch listings (${res.status})`);
  }
  return await res.json();
}

export async function fetchDonorListings() {
  const res = await fetch(`${API_BASE}/donor/my-listings`, {
    headers: getAuthHeaders()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch donor listings');
  }
  return data.listings || [];
}

export async function createListing(payload) {
  const res = await fetch(`${API_BASE}/listings`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save listing');
  }
  return data;
}

export async function updateListing(id, updates) {
  const res = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update listing');
  }
  return data;
}

export async function deleteListing(id) {
  const res = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete listing');
  }
  return true;
}

// =============================================================================
// Claim & Pickup Workflow
// =============================================================================

export async function createClaim({ listing_id, quantity_requested, message }) {
  const res = await fetch(`${API_BASE}/claims`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ listing_id, quantity_requested, message })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit claim request');
  }
  return data;
}

export async function fetchRecipientClaims() {
  const res = await fetch(`${API_BASE}/recipient/my-claims`, {
    headers: getAuthHeaders()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch recipient claims');
  }
  return data.claims || [];
}

export async function updateClaimStatus(claimId, status) {
  const res = await fetch(`${API_BASE}/claims/${claimId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update claim status');
  }
  return data;
}

export async function cancelClaim(claimId) {
  const res = await fetch(`${API_BASE}/claims/${claimId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to cancel claim');
  }
  return true;
}

// =============================================================================
// In-App Notifications
// =============================================================================

export async function fetchNotifications() {
  const token = getToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: getAuthHeaders()
  });
  const data = await res.json().catch(() => ({}));
  return data.notifications || [];
}

export async function markNotificationRead(id) {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  return res.ok;
}

// =============================================================================
// Real Impact Statistics
// =============================================================================

export async function fetchImpactStats() {
  const res = await fetch(`${API_BASE}/impact-stats`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch impact statistics');
  }
  return data.stats;
}
