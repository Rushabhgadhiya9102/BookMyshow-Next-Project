'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { POPULAR_CITIES } from '../types';

interface CityContextValue {
  currentCity: string;
  setCity: (city: string) => void;
  isCityModalOpen: boolean;
  openCityModal: () => void;
  closeCityModal: () => void;
}

const CityContext = createContext<CityContextValue | undefined>(undefined);

function subscribeToCity(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('bms_city_changed', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('bms_city_changed', callback);
  };
}

function getCitySnapshot(): string {
  if (typeof window === 'undefined') return 'Mumbai';
  return localStorage.getItem('bms_selected_city') || 'Mumbai';
}

function getServerCitySnapshot(): string {
  return 'Mumbai';
}

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // External store for client localStorage
  const storedCity = useSyncExternalStore(
    subscribeToCity,
    getCitySnapshot,
    getServerCitySnapshot
  );

  // URL query parameter takes priority if present
  const urlCity = searchParams.get('city');
  const matchedUrlCity = useMemo(() => {
    if (!urlCity) return null;
    const found = POPULAR_CITIES.find(
      (c) =>
        c.slug.toLowerCase() === urlCity.toLowerCase() ||
        c.name.toLowerCase() === urlCity.toLowerCase()
    );
    return found ? found.name : urlCity.charAt(0).toUpperCase() + urlCity.slice(1);
  }, [urlCity]);

  const currentCity = matchedUrlCity || storedCity;

  const setCity = useCallback(
    (cityName: string) => {
      setIsCityModalOpen(false);

      try {
        localStorage.setItem('bms_selected_city', cityName);
        document.cookie = `bms_city=${encodeURIComponent(
          cityName
        )}; path=/; max-age=31536000; SameSite=Lax`;
        window.dispatchEvent(new Event('bms_city_changed'));
      } catch {
        // ignore
      }

      // If on /movies, update URL query parameter to match
      if (pathname === '/movies') {
        const params = new URLSearchParams(searchParams.toString());
        params.set('city', cityName.toLowerCase());
        router.push(`/movies?${params.toString()}`);
      }
    },
    [pathname, router, searchParams]
  );

  const openCityModal = useCallback(() => setIsCityModalOpen(true), []);
  const closeCityModal = useCallback(() => setIsCityModalOpen(false), []);

  const value = useMemo(
    () => ({
      currentCity,
      setCity,
      isCityModalOpen,
      openCityModal,
      closeCityModal,
    }),
    [currentCity, setCity, isCityModalOpen, openCityModal, closeCityModal]
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};

export const useCity = (): CityContextValue => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};
