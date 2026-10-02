// Firebase initialization and helpers
import { firebaseConfig } from './firebase-config.js';

const FIREBASE_VERSION = '10.7.1';
const CDN_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;

// Load Firebase modules
const { initializeApp } = await import(`${CDN_BASE}/firebase-app.js`);
const { getAuth, signInAnonymously, signInWithEmailAndPassword, onAuthStateChanged, signOut } =
  await import(`${CDN_BASE}/firebase-auth.js`);
const { getDatabase, ref, set, get, onValue, off, push, remove, onDisconnect } =
  await import(`${CDN_BASE}/firebase-database.js`);

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Export Firebase functions
export {
  signInAnonymously,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  ref,
  set,
  get,
  onValue,
  off,
  push,
  remove,
  onDisconnect
};

// Helper to get session ID from URL
export function getSessionId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('s') || 'summit';
}

// Helper to get story file from URL
export function getStoryFile() {
  const params = new URLSearchParams(window.location.search);
  return params.get('story') || 'story.md';
}

// Session paths
export function sessionPath(sessionId) {
  return `sessions/${sessionId}`;
}

export function votesPath(sessionId, nodeId, round) {
  return `votes/${sessionId}/${nodeId}/${round}`;
}

export function presencePath(sessionId, uid) {
  return `presence/${sessionId}/${uid}`;
}

// Load story.md with cache busting
export async function loadStory(filename = 'story.md') {
  const response = await fetch(`${filename}?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${filename}: ${response.statusText}`);
  }
  return await response.text();
}
