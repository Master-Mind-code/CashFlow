import { useEffect, useState } from 'react';
import { blink } from '@/lib/blink';
import type { BlinkUser } from '@blinkdotnew/sdk';

const DEMO_USER: BlinkUser = {
  id: 'usr_caissier_01',
  email: 'caissier.diallo@biotransac.sn',
  displayName: 'Mamadou Diallo',
  createdAt: new Date().toISOString(),
} as any;

export function useAuth() {
  const [user, setUser] = useState<BlinkUser | null>(() => {
    const stored = localStorage.getItem('cashflow_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cashflow_user');
    if (stored) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = blink.auth.onAuthStateChanged((state) => {
        if (state.user) {
          setUser(state.user);
        }
        setLoading(state.isLoading);
      });
      return unsubscribe;
    } catch {
      setLoading(false);
    }
  }, []);

  const loginDemo = () => {
    localStorage.setItem('cashflow_user', JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
  };

  const login = async () => {
    try {
      await blink.auth.login();
    } catch (e) {
      console.warn('Blink login redirect error, defaulting to demo user:', e);
      loginDemo();
    }
  };

  const logout = () => {
    localStorage.removeItem('cashflow_user');
    try {
      blink.auth.logout();
    } catch {
      // ignore
    }
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    loginDemo,
    logout,
  };
}
