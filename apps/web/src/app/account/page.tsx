'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FiUser,
  FiFilm,
  FiMapPin,
  FiGlobe,
  FiShield,
  FiArrowRight,
  FiCheckCircle,
} from 'react-icons/fi';
import { useAccount } from '@/features/account/context/AccountContext';
import { accountApi } from '@/features/account/api';
import type { BookingItem, SessionItem } from '@/features/account/types';

export default function AccountOverviewPage() {
  const { user } = useAccount();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [bookingsData, sessionsData] = await Promise.allSettled([
          accountApi.getBookings(),
          accountApi.getActiveSessions(),
        ]);

        if (isMounted) {
          if (bookingsData.status === 'fulfilled') {
            setBookings(bookingsData.value);
          }
          if (sessionsData.status === 'fulfilled') {
            setSessions(sessionsData.value);
          }
        }
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-linear-to-r from-red-600 via-rose-600 to-red-500 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="text-xs uppercase font-bold tracking-widest text-red-200">
            Welcome to BookMyShow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Hi, {user?.username || 'Movie Lover'}! 👋
          </h2>
          <p className="text-red-100 text-sm mt-2 leading-relaxed">
            Manage your movie tickets, update preferences, and secure your account
            all from this centralized dashboard.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium">
            <span className="bg-white/20 backdrop-blur-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <FiCheckCircle className="text-white" size={14} /> Member since {memberSince}
            </span>
            <span className="bg-white/20 backdrop-blur-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <FiMapPin className="text-white" size={14} /> {user?.preferredCity || 'Navsari'}
            </span>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10 text-white pointer-events-none select-none">
          <FiFilm size={260} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Bookings
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {loadingData ? '—' : bookings.length}
            </span>
            <FiFilm className="text-red-500" size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            City
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-base font-bold text-gray-900 truncate">
              {user?.preferredCity || 'Navsari'}
            </span>
            <FiMapPin className="text-red-500" size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Language
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-base font-bold text-gray-900 truncate">
              {user?.preferredLanguage || 'English'}
            </span>
            <FiGlobe className="text-red-500" size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Active Devices
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {loadingData ? '—' : sessions.length || 1}
            </span>
            <FiShield className="text-emerald-500" size={20} />
          </div>
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/account/profile"
          className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
              <FiUser size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-red-600 transition-colors">
                Personal Information
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Update name, contact number, avatar and location
              </p>
            </div>
          </div>
          <FiArrowRight
            size={18}
            className="text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all"
          />
        </Link>

        <Link
          href="/account/bookings"
          className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
              <FiFilm size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-red-600 transition-colors">
                Ticket Bookings
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Access your movie tickets, booking details and QR passes
              </p>
            </div>
          </div>
          <FiArrowRight
            size={18}
            className="text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all"
          />
        </Link>

        <Link
          href="/account/security"
          className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
              <FiShield size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-red-600 transition-colors">
                Login & Security
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Change password, review active sessions and revoke devices
              </p>
            </div>
          </div>
          <FiArrowRight
            size={18}
            className="text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all"
          />
        </Link>

        <Link
          href="/account/settings"
          className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
              <FiGlobe size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-red-600 transition-colors">
                Preferences & Notifications
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Default cinema city, entertainment languages, and alerts
              </p>
            </div>
          </div>
          <FiArrowRight
            size={18}
            className="text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all"
          />
        </Link>
      </div>

      {/* Recent Bookings Snapshot */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Recent Bookings</h3>
          <Link
            href="/account/bookings"
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
          >
            View all bookings <FiArrowRight size={13} />
          </Link>
        </div>

        {loadingData ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Loading recent bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <FiFilm className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm font-semibold text-gray-700">No bookings yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Ready for your next cinema adventure? Explore trending blockbuster movies now!
            </p>
            <Link
              href="/movies"
              className="inline-block mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                    <FiFilm size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {item.show?.movie?.title || 'Movie Booking'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {item.show?.screen?.theater?.name || 'Cinema Hall'} •{' '}
                      {new Date(item.show?.startTime || item.createdAt).toLocaleDateString('en-US')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    ₹{item.totalAmount}
                  </span>
                  <div>
                    <span
                      className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        item.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
