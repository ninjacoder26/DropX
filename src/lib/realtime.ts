/**
 * Realtime is enhancement-only: live badges and toasts are nice, but a
 * failing socket must never break the admin (or any page). Every caller
 * must check availability first AND wrap subscribe in try/catch — polling
 * fallbacks already cover the data either way.
 */
export function isRealtimeAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (typeof window.WebSocket === 'undefined') return false;
    // wss: needs a secure page (localhost exempt for development).
    const { protocol, hostname } = window.location;
    if (protocol !== 'https:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
