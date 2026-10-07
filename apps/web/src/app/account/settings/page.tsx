'use client';

import React, { useState, useEffect } from 'react';
import { FiMapPin, FiGlobe, FiBell, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAccount } from '@/features/account/context/AccountContext';
import { accountApi } from '@/features/account/api';
import { CITIES, LANGUAGES } from '@/features/account/types';

export default function SettingsPage() {
  const { user, setUser } = useAccount();

  const [city, setCity] = useState('Navsari');
  const [language, setLanguage] = useState('English');
  const [notifications, setNotifications] = useState({
    emailReceipts: true,
    whatsappTickets: true,
    promoOffers: false,
    showReminders: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.preferredCity) setCity(user.preferredCity);
      if (user.preferredLanguage) setLanguage(user.preferredLanguage);
    }
  }, [user]);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await accountApi.updateProfile({
        preferredCity: city,
        preferredLanguage: language,
      });

      setUser((prev) => (prev ? { ...prev, ...res.user } : res.user));
      toast.success('Preferences saved successfully!');
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(
        errorObj.response?.data?.message || 'Failed to save preferences'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs">
      <div className="border-b border-gray-100 pb-5 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Preferences & Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize your cinema browsing experience, location defaults, and notifications.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* City & Regional Settings */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
            <FiMapPin className="text-red-500" /> Default Cinema City
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Showtimes, theater listings, and ticket availability will automatically prioritize this city.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {CITIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCity(c)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  city === c
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-2xs'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Language */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
            <FiGlobe className="text-red-500" /> Preferred Entertainment Language
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Helps us recommend movie trailers, premiere events, and regional theater releases.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {LANGUAGES.map((l) => (
              <button
                type="button"
                key={l}
                onClick={() => setLanguage(l)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  language === l
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-2xs'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
            <FiBell className="text-red-500" /> Notifications & Alerts
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Control the updates and notifications you receive across channels.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Email Booking Confirmation
                </p>
                <p className="text-xs text-gray-500">
                  Receive instant e-tickets and tax invoices after booking.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailReceipts}
                onChange={() => handleToggle('emailReceipts')}
                className="w-4 h-4 text-red-600 rounded-sm focus:ring-red-500 accent-red-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  WhatsApp Ticket Delivery
                </p>
                <p className="text-xs text-gray-500">
                  Get your entry QR code directly on WhatsApp for quick access.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.whatsappTickets}
                onChange={() => handleToggle('whatsappTickets')}
                className="w-4 h-4 text-red-600 rounded-sm focus:ring-red-500 accent-red-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Showtime Reminders
                </p>
                <p className="text-xs text-gray-500">
                  Get reminded 2 hours before your scheduled movie show.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.showReminders}
                onChange={() => handleToggle('showReminders')}
                className="w-4 h-4 text-red-600 rounded-sm focus:ring-red-500 accent-red-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Special Offers & Deals
                </p>
                <p className="text-xs text-gray-500">
                  Receive occasional newsletters regarding promo codes and festival discounts.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.promoOffers}
                onChange={() => handleToggle('promoOffers')}
                className="w-4 h-4 text-red-600 rounded-sm focus:ring-red-500 accent-red-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiSave size={16} />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
