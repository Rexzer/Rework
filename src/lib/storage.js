// Rework's persistence layer for standalone deployment.
//
// This replaces claude.ai's `window.storage` (which only exists inside the
// claude.ai artifact sandbox) with the browser's real `localStorage` API.
// Data saved here lives entirely in the visitor's own browser, on their own
// device -- never sent to Anthropic, never sent to any server, since there
// is no server. Closing the tab, restarting the browser, or coming back
// tomorrow will not lose data. Clearing site data / browser storage for this
// site, using a different browser, or a different device will.
//
// The function signatures (async, JSON-serialized, key + fallback) match
// what the rest of the app already expects, so App.jsx needed almost no
// changes beyond importing from here instead of calling window.storage.

const isBrowser = typeof window !== "undefined" && !!window.localStorage;

export async function loadKey(key, fallback) {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    // Corrupted value, or localStorage unavailable (e.g. some private-browsing modes) -- fail soft.
    console.error("Rework storage: failed to load", key, e);
    return fallback;
  }
}

export async function saveKey(key, value) {
  if (!isBrowser) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // Most likely storage quota exceeded, or storage disabled by the browser/user.
    console.error("Rework storage: failed to save", key, e);
    return false;
  }
}

export async function deleteKey(key) {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    console.error("Rework storage: failed to delete", key, e);
  }
}
