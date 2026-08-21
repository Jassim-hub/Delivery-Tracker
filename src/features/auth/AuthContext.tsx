import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Role } from '@/types';
import { mockStore } from '@/lib/supabase/mock-store';
import { supabase, isUsingMockBackend } from '@/lib/supabase/client';
import { INITIAL_PROFILES } from '@/lib/supabase/mock-data';

interface AuthContextType {
  user: Profile | null;
  role: Role | null;
  isLoading: boolean;
  loginAs: (profileId: string) => void;
  loginWithEmail: (email: string, password?: string) => Promise<{ error?: string }>;
  signup: (fullName: string, email: string, phone: string, role: 'rider' | 'customer', password?: string) => Promise<{ error?: string }>;
  logout: () => void;
  availableProfiles: Profile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'dt_current_user_id_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    // Load initial profiles
    const allProfiles = mockStore.getProfiles();
    setProfiles(allProfiles);

    // Subscribe to profile changes (e.g., new signup)
    const unsubscribeProfiles = mockStore.subscribe(() => {
      setProfiles(mockStore.getProfiles());
    });

    if (isUsingMockBackend) {
      const savedUserId = localStorage.getItem(CURRENT_USER_KEY);
      const found = allProfiles.find((p) => p.id === savedUserId);
      if (found) {
        setUser(found);
      } else {
        // Default to John Mukasa (Rider) for instant interactive experience
        const defaultUser = allProfiles.find((p) => p.role === 'rider') || allProfiles[0];
        setUser(defaultUser);
        if (defaultUser) {
          localStorage.setItem(CURRENT_USER_KEY, defaultUser.id);
        }
      }
      setIsLoading(false);
    } else {
      // Live Supabase Auth Session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) setUser(data as Profile);
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) setUser(data as Profile);
            });
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
        unsubscribeProfiles();
      };
    }

    return () => {
      unsubscribeProfiles();
    };
  }, []);

  const loginAs = (profileId: string) => {
    const allProfiles = mockStore.getProfiles();
    const found = allProfiles.find((p) => p.id === profileId);
    if (found) {
      setUser(found);
      localStorage.setItem(CURRENT_USER_KEY, found.id);
    }
  };

  const loginWithEmail = async (email: string, password?: string): Promise<{ error?: string }> => {
    if (isUsingMockBackend) {
      // Passwords are no longer stored in localStorage (security fix).
      // Compare against the in-memory INITIAL_PROFILES seed list instead.
      const match = INITIAL_PROFILES.find(
        (p) => p.email?.toLowerCase() === email.toLowerCase() && p.password === password
      );
      if (match) {
        loginAs(match.id);
        return {};
      }
      return { error: 'Invalid email or password.' };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password ?? '',
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  const signup = async (
    fullName: string,
    email: string,
    phone: string,
    role: 'rider' | 'customer',
    password?: string,
  ): Promise<{ error?: string }> => {
    if (!isUsingMockBackend) {
      // Live Supabase signup
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password: password ?? '',
          options: { data: { full_name: fullName, role } },
        });
        if (error) return { error: error.message };
        return {};
      } catch (err: any) {
        return { error: err.message || 'Signup failed' };
      }
    }

    // ---- Mock-mode signup ----
    // Check for duplicate email
    const existingProfiles = mockStore.getProfiles();
    if (email && existingProfiles.some((p) => p.email?.toLowerCase() === email.toLowerCase())) {
      return { error: 'An account with that email already exists.' };
    }

    // SEC-2 FIX: never store passwords in localStorage. The password field
    // only lives in INITIAL_PROFILES in memory for demo login. New mock
    // accounts are recognised via their id in localStorage, not password.
    const newProfile: Profile = {
      id: `${role[0]}${Date.now().toString().slice(-11)}`,
      full_name: fullName,
      email,
      // password intentionally omitted — not stored on disk
      phone,
      role,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // SEC-3 / STRUCT-1 FIX: route ALL writes through mockStore so caches stay
    // consistent and magic localStorage key strings are in one place only.
    mockStore.addProfile(newProfile);

    if (role === 'rider') {
      mockStore.addRawRider({
        user_id: newProfile.id,
        vehicle_type: 'Motorcycle',
        license_plate: 'UAA 100A',
        is_online: true,
        current_lat: 0.318,
        current_lng: 32.581,
        last_location_at: new Date().toISOString(),
        avg_rating: 5.0,
        total_deliveries: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      mockStore.addCustomer({
        user_id: newProfile.id,
        default_address: null,
        default_lat: null,
        default_lng: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    loginAs(newProfile.id);
    return {};
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
    if (!isUsingMockBackend) {
      supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        loginAs,
        loginWithEmail,
        signup,
        logout,
        availableProfiles: profiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
