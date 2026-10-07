'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FiSearch, FiX, FiMapPin, FiCheck } from 'react-icons/fi';
import { useCity } from '../context/CityContext';
import { POPULAR_CITIES, OTHER_CITIES } from '../types';

export const CityModal: React.FC = () => {
  const { currentCity, setCity, isCityModalOpen, closeCityModal } = useCity();
  const [searchTerm, setSearchTerm] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCityModalOpen) {
        closeCityModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCityModalOpen, closeCityModal]);

  const allCities = useMemo(() => {
    const unique = new Set<string>();
    POPULAR_CITIES.forEach((c) => unique.add(c.name));
    OTHER_CITIES.forEach((c) => unique.add(c));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredCities = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allCities.filter((c) => c.toLowerCase().includes(term));
  }, [allCities, searchTerm]);

  if (!isCityModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header with Search */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FiMapPin className="text-red-500" /> Select Your City
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Movies, showtimes, and cinema pricing are customized to your location.
              </p>
            </div>
            <button
              onClick={closeCityModal}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <FiSearch size={18} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for your city (e.g. Mumbai, Ahmedabad, Bengaluru)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-800"
              autoFocus
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {searchTerm.trim() ? (
            /* Search Results */
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Matching Cities ({filteredCities.length})
              </h4>
              {filteredCities.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">
                  No cities found matching &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredCities.map((city) => {
                    const isSelected =
                      currentCity.toLowerCase() === city.toLowerCase();
                    return (
                      <button
                        key={city}
                        onClick={() => setCity(city)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'border-red-500 bg-red-50 text-red-600 font-semibold'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <span>{city}</span>
                        {isSelected && <FiCheck size={16} className="text-red-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Default View: Popular Cities + All Cities */
            <>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Popular Cities
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {POPULAR_CITIES.map((city) => {
                    const isSelected =
                      currentCity.toLowerCase() === city.name.toLowerCase();
                    return (
                      <button
                        key={city.slug}
                        onClick={() => setCity(city.name)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer group ${
                          isSelected
                            ? 'border-red-500 bg-red-50/70 text-red-600 shadow-2xs font-semibold'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 ${
                            isSelected
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <FiMapPin size={20} />
                        </div>
                        <span className="text-xs font-medium">{city.name}</span>
                        {city.state && (
                          <span className="text-[10px] text-gray-400 mt-0.5">
                            {city.state}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Other Cities Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Other Cities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {OTHER_CITIES.map((city) => {
                    const isSelected =
                      currentCity.toLowerCase() === city.toLowerCase();
                    return (
                      <button
                        key={city}
                        onClick={() => setCity(city)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-600 text-white font-semibold'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
