'use client';
import AdminHeader from '@/shared/components/layout/AdminHeader';
import RevenueChart from '@/features/admin/components/RevenueChart';
import type { AuthTokenPayload } from '@/features/auth/types';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { getmovie } from '@/features/movies/store/thunk';
import { getTickets } from '@/features/tickets/store/thunk';
import { getOnlyUser } from '@/features/auth/store/thunk';
import { jwtDecode } from 'jwt-decode';
import { useCookies } from 'next-client-cookies';
import Link from 'next/link';
import { useEffect } from 'react';
import { FaTableList } from 'react-icons/fa6';
import { IoPersonCircleOutline } from 'react-icons/io5';
import { MdFormatListBulletedAdd } from 'react-icons/md';

const DashBoard = () => {
  // ======================================================== //
  // ======================= VARIABLES ====================== //
  // ======================================================== //

  const cookies = useCookies();
  const dispatch = useAppDispatch();
  const token = cookies.get('token');
  const { users } = useAppSelector(state => state.users);
  const { tickets } = useAppSelector(state => state.tickets);
  const decodedUser = token ? jwtDecode<AuthTokenPayload>(token) : null;
  const userEmail = decodedUser?.email ?? '';
  const userName = decodedUser?.username ?? '';
  const dashboardDate = new Date();
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const greetings =
    dashboardDate.getHours() < 12
      ? 'Good Morning'
      : dashboardDate.getHours() < 16
        ? 'Good Afternoon'
        : 'Good Evening';
  const currentDay = dashboardDate.toLocaleString('en-US', { weekday: 'long' });
  const currentDate = dashboardDate.toLocaleDateString(undefined, dateFormatOptions);

  // ======================================================== //
  // ======================= TOKEN DECODED OR READ ====================== //
  // ======================================================== //

  // ======================================================== //
  // ======================= FETCH DATAS ====================== //
  // ======================================================== //

  useEffect(() => {
    dispatch(getmovie());
    dispatch(getTickets());
    dispatch(getOnlyUser());
  }, [dispatch]);

  // ======================================================== //
  // ======================= LAST 7 DAYS REVENUE ====================== //
  // ======================================================== //
  const lastWeekRevenue = tickets
    .filter(t => {
      const date = new Date(t.createdAt);
      const today = new Date();
      const diff = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    })
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  // ======================================================== //
  // ======================= MONTHLY REVENUE ====================== //
  // ======================================================== //

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyRevenue = tickets
    .filter(t => {
      const date = new Date(t.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  // ======================================================== //
  // ======================= TOTAL REVENUE ====================== //
  // ======================================================== //

  const totalRevenue = tickets.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const today = new Date().toISOString().split('T')[0];

  const todayRevenue = tickets
    .filter(t => t.createdAt && t.createdAt.split('T')[0] === today)
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <>
      <AdminHeader />
      <section className="banner-section pt-10 mb-3 container px-5 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-3">
          {/* ======================================================== */}
          {/* ======================= GREETING SECTION ====================== */}
          {/* ======================================================== */}

          <div className="banner-item">
            <div className="h-full bg-linear-to-r from-red-500 to-orange-500 rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
              <h2 className="text-3xl font-semibold text-white line-clamp-1 py-1">
                {greetings} {userName}
              </h2>
              <p className="text-lg text-white/80 font-semibold">{userEmail}</p>
              <p className="text-xl text-white/90 font-semibold mt-2">{currentDay}</p>
              <p className="text-xl text-white/80 font-semibold">{currentDate}</p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* ======================= QUICK ACCESS PANEL ====================== */}
          {/* ======================================================== */}

          <div className="banner-item">
            <div className="quick-selection">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                  Quick Actions
                </h2>
                <div>
                  <Link href={'/movies/new'}>
                    <button className="w-full flex items-center justify-between cursor-pointer p-3 mb-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                      <span>Add Movie</span>
                      <MdFormatListBulletedAdd />
                    </button>
                  </Link>
                  <Link href={'/movies'}>
                    <button className="w-full flex items-center justify-between p-3 cursor-pointer bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors">
                      <span>Views Movies</span>
                      <FaTableList />
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* ======================= TOTAL MOVIES SECTION ====================== */}
            {/* ======================================================== */}
          </div>
          <div className="banner-item">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 h-full">
              <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300">
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold">{monthlyRevenue} â‚¹</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300">
                <p className="text-sm text-gray-500">Weekly Revenue</p>
                <p className="text-2xl font-bold text-blue-500">{lastWeekRevenue} â‚¹</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-green-500">{totalRevenue} â‚¹</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300">
                <p className="text-sm text-gray-500">Today Revenue</p>
                <p className="text-2xl font-bold text-red-500">{todayRevenue} â‚¹</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
          <RevenueChart tickets={tickets} />

          <div>
            <div className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Users Login ({users.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {users.map((val, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-xl hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <IoPersonCircleOutline className="text-indigo-600" size={20} />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">{val.username}</p>
                        <p className="text-sm text-gray-500">{val.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default DashBoard;
