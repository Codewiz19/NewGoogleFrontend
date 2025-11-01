/**
 * Document Cache Manager
 * Stores document data in localStorage for persistence across page navigation
 */

export interface CachedDocument {
  doc_id: string;
  filename: string;
  uploaded_at: number;
  summary?: string;
  summary_generated_at?: number;
  risks?: any[];
  risks_generated_at?: number;
  text_info?: any;
  corpus_name?: string;
}

const CACHE_KEY_PREFIX = 'doc_cache_';
const CURRENT_DOC_KEY = 'current_doc_id';

/**
 * Get the current active document ID
 */
export const getCurrentDocId = (): string | null => {
  return localStorage.getItem(CURRENT_DOC_KEY);
};

/**
 * Set the current active document ID
 */
export const setCurrentDocId = (docId: string): void => {
  localStorage.setItem(CURRENT_DOC_KEY, docId);
};

/**
 * Clear the current document ID
 */
export const clearCurrentDocId = (): void => {
  localStorage.removeItem(CURRENT_DOC_KEY);
};

/**
 * Store document data in cache
 */
export const cacheDocument = (doc: CachedDocument): void => {
  const key = `${CACHE_KEY_PREFIX}${doc.doc_id}`;
  localStorage.setItem(key, JSON.stringify(doc));
  setCurrentDocId(doc.doc_id);
};

/**
 * Get cached document data
 */
export const getCachedDocument = (docId: string): CachedDocument | null => {
  const key = `${CACHE_KEY_PREFIX}${docId}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error('Error parsing cached document:', e);
      return null;
    }
  }
  return null;
};

/**
 * Update specific fields in cached document
 */
export const updateCachedDocument = (docId: string, updates: Partial<CachedDocument>): void => {
  const existing = getCachedDocument(docId);
  if (existing) {
    const updated = { ...existing, ...updates };
    cacheDocument(updated);
  } else {
    // Create new cache entry if it doesn't exist
    cacheDocument({
      doc_id: docId,
      filename: updates.filename || 'Document',
      uploaded_at: updates.uploaded_at || Date.now(),
      ...updates
    });
  }
};

/**
 * Get cached summary
 */
export const getCachedSummary = (docId: string): string | null => {
  const doc = getCachedDocument(docId);
  return doc?.summary || null;
};

/**
 * Get cached risks
 */
export const getCachedRisks = (docId: string): any[] | null => {
  const doc = getCachedDocument(docId);
  return doc?.risks || null;
};

/**
 * Clear all cached documents
 */
export const clearAllCache = (): void => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  clearCurrentDocId();
};

/**
 * Check if document data is complete (has summary and risks)
 */
export const isDocumentComplete = (docId: string): boolean => {
  const doc = getCachedDocument(docId);
  return !!(doc?.summary && doc?.risks);
};

