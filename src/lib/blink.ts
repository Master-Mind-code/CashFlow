import { createClient } from '@blinkdotnew/sdk';

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'secure-cashflow-app-dm5j1jb0',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_5unMdTharraMym0vppBVeM9BIXJ-ni1m',
  auth: { mode: 'managed' },
});

export async function getCurrentUser() {
  try {
    const user = await blink.auth.me();
    if (user) return user;
  } catch {
    // ignore
  }
  const stored = localStorage.getItem('cashflow_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}
