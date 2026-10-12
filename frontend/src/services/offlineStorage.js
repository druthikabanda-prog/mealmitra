/**
 * MealMitra - IndexedDB Local Persistence Layer.
 * Provides offline-capable storage for:
 * 1. Previously fetched public food listings (with cachedAt timestamp)
 * 2. Locally prepared food listing drafts ("Saved Draft — Not Published")
 * 
 * Safety Rules:
 * - Does NOT store passwords or sensitive auth session tokens.
 * - Offline drafts are strictly marked as unverified drafts until synced online.
 * - Cached listings are flagged with their cache timestamp and not guaranteed available.
 */

const DB_NAME = 'MealMitraDB';
const DB_VERSION = 1;
const STORE_LISTINGS = 'cached_listings';
const STORE_DRAFTS = 'offline_drafts';

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported in this browser environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_LISTINGS)) {
        db.createObjectStore(STORE_LISTINGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Caches latest successfully fetched listings with a timestamp.
 */
export async function saveCachedListings(listings = []) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_LISTINGS, 'readwrite');
    const store = tx.objectStore(STORE_LISTINGS);
    store.put({
      id: 'active_feed',
      listings: listings,
      cachedAt: new Date().toISOString()
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to cache listings in IndexedDB:', err);
    return false;
  }
}

/**
 * Retrieves cached listings and timestamp for offline viewing.
 */
export async function getCachedListings() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_LISTINGS, 'readonly');
    const store = tx.objectStore(STORE_LISTINGS);
    const request = store.get('active_feed');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve({
            listings: request.result.listings || [],
            cachedAt: request.result.cachedAt || null
          });
        } else {
          resolve({ listings: [], cachedAt: null });
        }
      };
      request.onerror = () => resolve({ listings: [], cachedAt: null });
    });
  } catch (err) {
    console.warn('Error reading cached listings:', err);
    return { listings: [], cachedAt: null };
  }
}

/**
 * Saves a food listing draft created offline.
 * Marked as "Saved Draft — Not Published".
 */
export async function saveOfflineDraft(draftData) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DRAFTS, 'readwrite');
    const store = tx.objectStore(STORE_DRAFTS);
    
    const draftRecord = {
      ...draftData,
      id: draftData.id || `draft-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      status: 'Saved Draft — Not Published',
      is_offline_draft: true,
      created_at: draftData.created_at || new Date().toISOString()
    };

    store.put(draftRecord);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(draftRecord);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save offline draft:', err);
    throw err;
  }
}

/**
 * Retrieves all offline drafts.
 */
export async function getOfflineDrafts() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DRAFTS, 'readonly');
    const store = tx.objectStore(STORE_DRAFTS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Error fetching offline drafts:', err);
    return [];
  }
}

/**
 * Deletes a draft once synced or removed by user.
 */
export async function deleteOfflineDraft(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DRAFTS, 'readwrite');
    const store = tx.objectStore(STORE_DRAFTS);
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to delete offline draft:', err);
    return false;
  }
}
