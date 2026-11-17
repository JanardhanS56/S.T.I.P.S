/**
 * UTM Campaign and Referral Tracking Utility (Item 14)
 * Safely parses UTM parameters from URL search params on landing,
 * caches them in sessionStorage without cookies or PII.
 */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'];
const STORAGE_KEY = 'stips_utm_params';

export function captureUtmParams() {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const captured = {};
    let hasUtm = false;

    for (const key of UTM_KEYS) {
      const val = params.get(key);
      if (val) {
        captured[key] = val.trim().slice(0, 100);
        hasUtm = true;
      }
    }

    if (hasUtm) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...captured,
          captured_at: new Date().toISOString()
        })
      );
      return captured;
    }
  } catch {
    // sessionStorage disabled or unavailable
  }
  return getUtmParams();
}

export function getUtmParams() {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
