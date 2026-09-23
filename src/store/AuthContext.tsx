import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { oauthRedirectTo, safeNextPath } from '../lib/oauth';
import { REFRESH_THROTTLE_MS, sessionNeedsRefresh } from '../lib/session';
import { isStaffRole, isSubadmin } from '../lib/permissions';
import { staffEmailForUsername, validateStaffPassword, validateStaffUsername } from '../lib/staff';
import type { Profile, Role } from '../types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  /** Session + profile both settled — gates should wait for this, not just loading. */
  ready: boolean;
  isAdmin: boolean;
  isSubadmin: boolean;
  isStaff: boolean;
  configured: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: (next?: string) => Promise<{ error: string | null }>;
  /** Team login: username + password, no email involved. */
  signInSubadmin: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const lastRefresh = useRef(0);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) {
      setProfileReady(true);
      return;
    }
    setProfileReady(false);
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) setProfile(data as Profile);
    } finally {
      setProfileReady(true);
    }
  };

  // Coming back to a stale tab used to fire the first queries with a dead
  // access token. Refresh up front when the token is expired or close to it.
  // A failed refresh here never signs out — either a later request succeeds
  // or the server rejects the session and SIGNED_OUT fires for real.
  const ensureFreshSession = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    if (Date.now() - lastRefresh.current < REFRESH_THROTTLE_MS) return;
    lastRefresh.current = Date.now();
    try {
      const { data } = await supabase.auth.getSession();
      if (!sessionNeedsRefresh(data.session)) return;
      await supabase.auth.refreshSession().catch(() => undefined);
    } catch {
      /* offline or transient — keep the stored session */
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setProfileReady(true);
      return;
    }
    let live = true;
    (async () => {
      try {
        await ensureFreshSession();
        const { data } = await supabase.auth.getSession();
        if (!live) return;
        setSession(data.session);
        if (data.session?.user) void fetchProfile(data.session.user.id);
        else setProfileReady(true);
      } finally {
        if (live) setLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!live) return;
      setSession(s);
      if (s?.user) void fetchProfile(s.user.id);
      else {
        setProfile(null);
        setProfileReady(true);
      }
    });
    const onReturn = () => {
      if (document.visibilityState === 'visible') void ensureFreshSession();
    };
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    window.addEventListener('pageshow', onReturn);
    return () => {
      live = false;
      sub.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
      window.removeEventListener('pageshow', onReturn);
    };
  }, [ensureFreshSession]);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      role: profile?.role ?? null,
      loading,
      ready: !loading && profileReady,
      isAdmin: profile?.role === 'admin' || profile?.role === 'superadmin',
      isSubadmin: isSubadmin(profile?.role),
      isStaff: isStaffRole(profile?.role),
      configured: isSupabaseConfigured,
      refreshProfile: async () => {
        if (session?.user) await fetchProfile(session.user.id);
      },
      signUp: async (email, password, fullName) => {
        if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet.' };
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        return { error: error?.message ?? null };
      },
      signIn: async (email, password) => {
        if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet.' };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      // Team login: username + password, no email involved. The username maps
      // to a synthetic unroutable auth email; plain Supabase sign-in, no
      // edge functions, no custom crypto.
      signInSubadmin: async (username, password) => {
        if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet.' };
        const uErr = validateStaffUsername(username);
        if (uErr) return { error: uErr };
        const pErr = validateStaffPassword(password);
        if (pErr) return { error: pErr };
        const { error } = await supabase.auth.signInWithPassword({
          email: staffEmailForUsername(username),
          password,
        });
        if (error) return { error: 'Wrong username or password.' };
        return { error: null };
      },
      signInWithGoogle: async (next = '/account') => {
        if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet.' };
        const safeNext = safeNextPath(next);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: oauthRedirectTo(window.location.origin, safeNext) },
        });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
      },
      resetPassword: async (email) => {
        if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet.' };
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error: error?.message ?? null };
      },
    }),
    [session, profile, loading, profileReady]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
