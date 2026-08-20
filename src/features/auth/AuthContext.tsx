import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Role } from '@/types';
import { mockStore } from '@/lib/supabase/mock-store';
import { supabase, isUsingMockBackend } from '@/lib/supabase/client';

interface AuthContextType {
  user: Profile | null;
  role: Role | null;
  isLoading: boolean;
  loginAs: (profileId: string) => void;
  loginWithEmail: (email: string, password?: string) => Promise<{ error?: string }>;
  signup: (fullName: string, email: string, phone: string, role: 'rider' | 'customer') => Promise<{ error?: string }>;
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
      };
    }
  }, []);

  const loginAs = (profileId: string) => {
    const allProfiles = mockStore.getProfiles();
    const found = allProfiles.find((p) => p.id === profileId);
    if (found) {
      setUser(found);
      localStorage.setItem(CURRENT_USER_KEY, found.id);
    }
  };

  const loginWithEmail = async (email: string, _password?: string): Promise<{ error?: string }> => {
    if (isUsingMockBackend) {
      const allProfiles = mockStore.getProfiles();
      const match = allProfiles.find(
        (p) => p.full_name.toLowerCase().includes(email.split('@')[0].toLowerCase()) || p.role === email.toLowerCase()
      );
      if (match) {
        loginAs(match.id);
        return {};
      }
      // fallback
      loginAs(allProfiles[0].id);
      return {};
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: _password || 'password123',
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  const signup = async (
    fullName: string,
    _email: string,
    phone: string,
    role: 'rider' | 'customer'
  ): Promise<{ error?: string }> => {
    const newProfile: Profile = {
      id: `${role[0]}${Date.now().toString().slice(-11)}`,
      full_name: fullName,
      phone,
      role,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const currentProfiles = mockStore.getProfiles();
    currentProfiles.push(newProfile);
    localStorage.setItem('dt_profiles_v1', JSON.stringify(currentProfiles));

    if (role === 'rider') {
      const riders = mockStore.getRiders();
      riders.push({
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
      localStorage.setItem('dt_riders_v1', JSON.stringify(riders));
    } else {
      const customers = mockStore.getProfiles().filter((p) => p.role === 'customer');
      localStorage.setItem('dt_customers_v1', JSON.stringify(customers));
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
