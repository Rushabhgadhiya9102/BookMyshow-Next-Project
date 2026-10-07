'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { accountApi } from '../api';
import type { UserProfile } from '../types';

interface AccountContextValue {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await accountApi.getProfile();
      setUser(profile);
    } catch (err) {
      const errorObj = err as { response?: { status?: number } };
      if (errorObj?.response?.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load profile. Please refresh or try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <AccountContext.Provider
      value={{ user, loading, error, refreshProfile, setUser }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextValue => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};
