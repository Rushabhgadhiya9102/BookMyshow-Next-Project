'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiUser,
  FiFilm,
  FiHeart,
  FiSettings,
  FiShield,
  FiLogOut,
  FiHome,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/shared/hooks/redux';
import { logout } from '@/features/auth/store/thunk';
import type { UserProfile } from '../types';

interface AccountNavProps {
  user?: UserProfile | null;
}

const navLinks = [
  {
    name: 'Overview',
    href: '/account',
    icon: FiHome,
  },
  {
    name: 'Profile Details',
    href: '/account/profile',
    icon: FiUser,
  },
  {
    name: 'My Bookings',
    href: '/account/bookings',
    icon: FiFilm,
  },
  {
    name: 'Saved & Favorites',
    href: '/account/favorites',
    icon: FiHeart,
  },
  {
    name: 'Preferences',
    href: '/account/settings',
    icon: FiSettings,
  },
  {
    name: 'Login & Security',
    href: '/account/security',
    icon: FiShield,
  },
];

export const AccountNav: React.FC<AccountNavProps> = ({ user }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.success('Logged out');
      router.push('/login');
    }
  };

  const displayName = user?.username || 'Movie Buff';
  const displayEmail = user?.email || 'user@example.com';
  const roleName = user?.role?.replace('_', ' ') || 'CUSTOMER';

  return (
    <aside className="w-full lg:w-72 shrink-0">
      {/* User Mini Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-14 h-14 rounded-full bg-linear-to-tr from-red-600 to-rose-400 text-white font-semibold text-xl flex items-center justify-center shadow-inner overflow-hidden shrink-0">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-base truncate">
              {displayName}
            </h3>
            <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
              {roleName}
            </span>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
          Account Hub
        </div>
        <ul className="space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    size={18}
                    className={isActive ? 'text-white' : 'text-gray-400'}
                  />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="pt-3 mt-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <FiLogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};
