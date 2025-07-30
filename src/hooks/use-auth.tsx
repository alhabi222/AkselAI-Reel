
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  Auth,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<any>;
  isTrialActive: boolean;
  daysRemainingInTrial: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Developer's master key email
const MASTER_EMAIL = "rgomet48@gmail.com";

const calculateTrialStatus = (user: User | null): { isActive: boolean; daysRemaining: number } => {
  // If it's the master user, trial is always active.
  if (user?.email === MASTER_EMAIL) {
    return { isActive: true, daysRemaining: 999 };
  }

  if (!user?.metadata?.creationTime) {
    return { isActive: false, daysRemaining: 0 };
  }
  const creationDate = new Date(user.metadata.creationTime);
  const now = new Date();
  const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;
  const trialEndDate = new Date(creationDate.getTime() + threeDaysInMillis);

  if (now > trialEndDate) {
    return { isActive: false, daysRemaining: 0 };
  }

  const diffInMillis = trialEndDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffInMillis / (1000 * 60 * 60 * 24));
  
  return { isActive: true, daysRemaining };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [daysRemainingInTrial, setDaysRemainingInTrial] = useState(0);
  const router = useRouter();

  useEffect(() => {
    try {
      const authInstance = getFirebaseAuth();
      setAuth(authInstance);

      if (authInstance) {
        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
          setUser(user);
          const { isActive, daysRemaining } = calculateTrialStatus(user);
          setIsTrialActive(isActive);
          setDaysRemainingInTrial(daysRemaining);
          setLoading(false);
          setIsInitialized(true);
        });
        return () => unsubscribe();
      } else {
        // Firebase is not configured.
        setLoading(false);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error during Firebase Auth initialization:", error);
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const login = (email: string, pass: string) => {
    if (!auth) {
        return Promise.reject(new Error("Firebase is not configured."));
    }
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const register = (email: string, pass: string) => {
    if (!auth) {
        return Promise.reject(new Error("Firebase is not configured."));
    }
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    loading,
    isInitialized,
    login,
    register,
    logout,
    isTrialActive,
    daysRemainingInTrial,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
