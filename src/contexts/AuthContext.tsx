import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getTierByProductId, SubscriptionTierKey } from "@/lib/subscriptionTiers";

interface SubscriptionState {
  subscribed: boolean;
  status: string | null;
  plan: SubscriptionTierKey | null;
  subscriptionEnd: string | null;
  trialEnd: string | null;
  loading: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  business: any | null;
  loading: boolean;
  subscription: SubscriptionState;
  signUp: (email: string, password: string, fullName: string) => Promise<{ session: Session | null; user: User | null }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [business, setBusiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    subscribed: false,
    status: null,
    plan: null,
    subscriptionEnd: null,
    trialEnd: null,
    loading: true,
  });

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
    return data;
  };

  const fetchBusiness = async (userId: string, profileBusinessId?: string | null) => {
    if (profileBusinessId) {
      const { data: profileBusiness } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", profileBusinessId)
        .maybeSingle();

      if (profileBusiness) {
        setBusiness(profileBusiness);
        return profileBusiness;
      }
    }

    const { data: ownedBusinesses } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1);

    const ownedBiz = ownedBusinesses?.[0] ?? null;
    if (ownedBiz) {
      setBusiness(ownedBiz);
      return ownedBiz;
    }

    const { data: teamMember } = await supabase
      .from("team_members")
      .select("business_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (teamMember) {
      const { data: teamBiz } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", teamMember.business_id)
        .single();
      setBusiness(teamBiz);
      return teamBiz;
    }

    setBusiness(null);
    return null;
  };

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) {
        setSubscription({ subscribed: false, status: null, plan: null, subscriptionEnd: null, trialEnd: null, loading: false });
        return;
      }
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });
      if (error) throw error;
      setSubscription({
        subscribed: data?.subscribed ?? false,
        status: data?.status ?? null,
        plan: data?.product_id ? getTierByProductId(data.product_id) : null,
        subscriptionEnd: data?.subscription_end ?? null,
        trialEnd: data?.trial_end ?? null,
        loading: false,
      });
    } catch {
      setSubscription((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    setSubscription((prev) => ({ ...prev, loading: true }));
    await checkSubscription();
  }, [checkSubscription]);

  const refreshBusiness = async () => {
    if (!user) return;
    const currentProfile = profile ?? await fetchProfile(user.id);
    await fetchBusiness(user.id, currentProfile?.business_id ?? null);
  };

  useEffect(() => {
    let isMounted = true;
    let authInitialized = false;

    const loadUserState = async (currentSession: Session | null) => {
      if (!isMounted) return;

      if (!currentSession?.user) {
        setProfile(null);
        setBusiness(null);
        setSubscription({ subscribed: false, status: null, plan: null, subscriptionEnd: null, trialEnd: null, loading: false });
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        let currentProfile: any | null = null;
        try {
          currentProfile = await fetchProfile(currentSession.user.id);
        } catch {
          setProfile(null);
        }

        try {
          await fetchBusiness(currentSession.user.id, currentProfile?.business_id ?? null);
        } catch {
          setBusiness(null);
        }

        try {
          await checkSubscription();
        } catch {
          // subscription state already handled in checkSubscription
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!authInitialized) {
          return;
        }

        void loadUserState(session);
      }
    );

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;

        authInitialized = true;
        setSession(session);
        setUser(session?.user ?? null);
        void loadUserState(session);
      })
      .catch(() => {
        if (!isMounted) return;

        // A temporary backend/network outage must never leave the app on the
        // loading screen indefinitely. Treat the unavailable session as signed
        // out; auth state will recover normally after the next successful login.
        authInitialized = true;
        setSession(null);
        setUser(null);
        void loadUserState(null);
      });

    return () => {
      isMounted = false;
      authSub.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
    return {
      session: data.session ?? null,
      user: data.user ?? null,
    };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, business, loading, subscription, signUp, signIn, signOut, refreshBusiness, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
