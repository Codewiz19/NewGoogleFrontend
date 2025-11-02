/**
 * API Configuration
 * Centralized API endpoint management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gcp25github-642359174267.asia-south2.run.app";

export const API = {
  upload: `${API_BASE_URL}/upload`,
  summarize: `${API_BASE_URL}/summarize`,
  risks: `${API_BASE_URL}/risks`,
  chat: `${API_BASE_URL}/chat`,
  getDocument: (docId: string) => `${API_BASE_URL}/document/${docId}`,
  debugRag: (docId: string) => `${API_BASE_URL}/debug_rag/${docId}`,
  lawyerQuestions: `${API_BASE_URL}/lawyer-questions`,
};

export default API;
