'use client';

import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiGlobe, FiCamera, FiCheck, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAccount } from '@/features/account/context/AccountContext';
import { accountApi } from '@/features/account/api';
import { CITIES, LANGUAGES } from '@/features/account/types';

export default function ProfilePage() {
  const { user, setUser } = useAccount();

  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    avatar: '',
    preferredCity: '',
    preferredLanguage: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        preferredCity: user.preferredCity || 'Navsari',
        preferredLanguage: user.preferredLanguage || 'English',
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarPreset = (url: string) => {
    setFormData((prev) => ({ ...prev, avatar: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    try {
      setSaving(true);
      const res = await accountApi.updateProfile({
        username: formData.username.trim(),
        phone: formData.phone.trim(),
        avatar: formData.avatar.trim(),
        preferredCity: formData.preferredCity,
        preferredLanguage: formData.preferredLanguage,
      });

      setUser((prev) => (prev ? { ...prev, ...res.user } : res.user));
      toast.success(res.message || 'Profile updated successfully!');
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(
        errorObj.response?.data?.message || 'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  const avatarPresets = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop',
  ];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs">
      <div className="border-b border-gray-100 pb-5 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          Update your public profile, contact details, and entertainment preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Profile Photo
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative w-20 h-20 rounded-full bg-linear-to-tr from-red-600 to-rose-400 text-white font-bold text-2xl flex items-center justify-center overflow-hidden shadow-inner shrink-0">
              {formData.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.avatar}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                formData.username?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiCamera size={16} />
                </span>
                <input
                  type="url"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="Enter custom image URL (https://...)"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-800"
                />
              </div>

              {/* Avatar quick presets */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Presets:</span>
                {avatarPresets.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAvatarPreset(preset)}
                    className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                      formData.avatar === preset
                        ? 'border-red-500 scale-105 ring-2 ring-red-500/20'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset}
                      alt={`Preset ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Name and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiUser size={16} />
              </span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-800"
                placeholder="Enter your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiMail size={16} />
              </span>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-9 pr-20 py-2.5 text-sm border border-gray-100 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <FiCheck size={12} /> Verified
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Phone Number
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FiPhone size={16} />
            </span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-800"
            />
          </div>
        </div>

        {/* Preferences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Preferred City
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiMapPin size={16} />
              </span>
              <select
                name="preferredCity"
                value={formData.preferredCity}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-800 bg-white"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Preferred Language
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FiGlobe size={16} />
              </span>
              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-800 bg-white"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
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
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
