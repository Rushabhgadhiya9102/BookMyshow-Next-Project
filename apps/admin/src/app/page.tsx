'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useCookies } from 'next-client-cookies';
import { jwtDecode } from 'jwt-decode';
import { FaTableList } from 'react-icons/fa6';
import { IoPersonCircleOutline, IoTicketOutline } from 'react-icons/io5';
import { MdFormatListBulletedAdd } from 'react-icons/md';
import {
  FiDollarSign,
  FiUsers,
  FiPercent,
  FiFilm,
  FiAlertTriangle,
  FiRefreshCw,
  FiCheckCircle,
  FiCalendar,
} from 'react-icons/fi';
import AdminHeader from '@/shared/components/layout/AdminHeader';
import RevenueChart from '@/features/admin/components/RevenueChart';
import type { AuthTokenPayload } from '@/features/auth/types';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { getmovie } from '@/features/movies/store/thunk';
import { getOnlyUser } from '@/features/auth/store/thunk';
import { adminApi, type DashboardMetrics, type RevenueAnalyticsPoint } from '@/features/admin/api';

const defaultMetrics: DashboardMetrics = {
  todayRevenue: 0,
  todayBookings: 0,
  ticketsSold: 0,
  occupancyRate: 0,
  activeShows: 0,
  failedPayments: 0,
  refundsCount: 0,
  refundsAmount: 0,
  registeredUsers: 0,
  weeklyRevenue: 0,
  monthlyRevenue: 0,
  totalRevenue: 0,
};

const DashBoard = () => {
  const cookies = useCookies();
  const dispatch = useAppDispatch();
  const token = cookies.get('token');
  const { users } = useAppSelector((state) => state.users);
  const decodedUser = token ? jwtDecode<AuthTokenPayload>(token) : null;
  const userEmail = decodedUser?.email ?? '';
  const userName = decodedUser?.username ?? '';

  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsPoint[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [revenueLoading, setRevenueLoading] = useState<boolean>(true);

  const dashboardDate = new Date();
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const greetings =
    dashboardDate.getHours() < 12
      ? 'Good Morning'
      : dashboardDate.getHours() < 16
        ? 'Good Afternoon'
        : 'Good Evening';
  const currentDay = dashboardDate.toLocaleString('en-US', { weekday: 'long' });
  const currentDate = dashboardDate.toLocaleDateString('en-US', dateFormatOptions);

  const loadServerAnalytics = useCallback(async () => {
    try {
      setLoadingMetrics(true);
      const metricsRes = await adminApi.getDashboardMetrics();
      setMetrics(metricsRes);
    } catch {
      // In development or when unauthenticated, default to clean zero state
    } finally {
      setLoadingMetrics(false);
    }

    try {
      setRevenueLoading(true);
      const revenueRes = await adminApi.getRevenueAnalytics(7);
      setRevenueData(revenueRes);
    } catch {
      // Clean fallback
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  useEffect(() => {
    dispatch(getmovie());
    dispatch(getOnlyUser());
    loadServerAnalytics();
  }, [dispatch, loadServerAnalytics]);

  return (
    <>
      <AdminHeader />
      <main className="banner-section pt-8 pb-12 container px-5 mx-auto space-y-6">
        {/* ======================================================== */}
        {/* ======================= TOP ROW BANNERS ================= */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Greeting Banner */}
          <div className="banner-item">
            <div className="h-full bg-linear-to-r from-red-500 to-orange-500 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 text-white flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-red-100 font-bold">
                  Admin Control Center
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold line-clamp-1 mt-1" suppressHydrationWarning>
                  {greetings} {userName}
                </h2>
                <p className="text-sm text-white/80 font-medium mt-0.5">{userEmail}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20">
                <p className="text-base text-white/90 font-semibold" suppressHydrationWarning>{currentDay}</p>
                <p className="text-sm text-white/80" suppressHydrationWarning>{currentDate}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="banner-item">
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between">
              <h2 className="text-lg font-bold mb-3 flex items-center text-gray-900">
                <span className="w-2.5 h-2.5 bg-purple-500 rounded-full mr-2"></span>
                Quick Actions
              </h2>
              <div className="space-y-2.5">
                <Link href="/movies/new" className="block">
                  <button className="w-full flex items-center justify-between cursor-pointer p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium text-sm">
                    <span>Add New Movie</span>
                    <MdFormatListBulletedAdd size={18} />
                  </button>
                </Link>
                <Link href="/movies" className="block">
                  <button className="w-full flex items-center justify-between p-3 cursor-pointer bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors font-medium text-sm">
                    <span>Manage Movies List</span>
                    <FaTableList size={16} />
                  </button>
                </Link>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 text-center">
                System role-based administrative permissions active
              </p>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="banner-item">
            <div className="grid grid-cols-2 gap-3 h-full">
              <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col justify-between">
                <p className="text-xs text-gray-500 font-medium">Today&apos;s Revenue</p>
                <p className="text-xl sm:text-2xl font-black text-red-600">
                  ₹{metrics.todayRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col justify-between">
                <p className="text-xs text-gray-500 font-medium">Weekly Revenue</p>
                <p className="text-xl sm:text-2xl font-black text-blue-600">
                  ₹{metrics.weeklyRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col justify-between">
                <p className="text-xs text-gray-500 font-medium">Monthly Revenue</p>
                <p className="text-xl sm:text-2xl font-black text-purple-600">
                  ₹{metrics.monthlyRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col justify-between">
                <p className="text-xs text-gray-500 font-medium">Total Lifetime</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-600">
                  ₹{metrics.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ============ SECTION 60: POSTGRESQL AGGREGATED METRICS == */}
        {/* ======================================================== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Section 60: Server-Side Real-Time Metrics</span>
              {loadingMetrics && (
                <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
              )}
            </h3>
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
              PostgreSQL Aggregated (Zero client-side filter)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Today Revenue */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Today Revenue</span>
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <FiDollarSign size={18} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">
                ₹{metrics.todayRevenue.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Confirmed transactions</p>
            </div>

            {/* 2. Today Bookings */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Today Bookings</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <FiCalendar size={18} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{metrics.todayBookings}</p>
              <p className="text-[11px] text-gray-400 mt-1">Orders finalized today</p>
            </div>

            {/* 3. Tickets Sold */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Tickets Sold</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FiCheckCircle size={18} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{metrics.ticketsSold}</p>
              <p className="text-[11px] text-gray-400 mt-1">Active & redeemed admissions</p>
            </div>

            {/* 4. Occupancy */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Occupancy</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FiPercent size={18} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{metrics.occupancyRate}%</p>
              <p className="text-[11px] text-gray-400 mt-1">Seats booked ratio</p>
            </div>

            {/* 5. Active Shows */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Shows</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <FiFilm size={18} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{metrics.activeShows}</p>
              <p className="text-[11px] text-gray-400 mt-1">Screenings running now</p>
            </div>

            {/* 6. Failed Payments */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Failed Payments</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <FiAlertTriangle size={18} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{metrics.failedPayments}</p>
              <p className="text-[11px] text-gray-400 mt-1">Requires reconciliation</p>
            </div>

            {/* 7. Refunds */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Refunds</span>
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                  <FiRefreshCw size={18} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{metrics.refundsCount}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                ₹{metrics.refundsAmount.toLocaleString()} refunded
              </p>
            </div>

            {/* 8. Registered Users */}
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Registered Users</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <FiUsers size={18} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">
                {metrics.registeredUsers || users.length}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Total user accounts</p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ============ CHARTS & RECENT ACTIVITY ================== */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart data={revenueData} loading={revenueLoading} />
          </div>

          <div>
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center text-gray-900">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-2"></span>
                    Recent Users ({users.length})
                  </h2>
                  <span className="text-xs text-gray-400 font-medium">Directory</span>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {users.slice(0, 6).map((val, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <IoPersonCircleOutline size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{val.username}</p>
                          <p className="text-[11px] text-gray-500">{val.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6">No users found.</p>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 mt-4 text-center">
                <Link
                  href="/movies"
                  className="text-xs font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <IoTicketOutline size={14} />
                  <span>Go to Theater Screenings</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default DashBoard;
