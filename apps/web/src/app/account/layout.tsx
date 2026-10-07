'use client';

import React from 'react';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import { AccountProvider, useAccount } from '@/features/account/context/AccountContext';
import { AccountNav } from '@/features/account/components/AccountNav';

const AccountLayoutInner: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAccount();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-gray-800">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        {/* Breadcrumb banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              My Account
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your personal profile, show bookings, preferences, and login security.
            </p>
          </div>
          {user?.preferredCity && (
            <div className="inline-flex items-center text-xs font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
              Selected City: <span className="font-semibold ml-1 text-gray-900">{user.preferredCity}</span>
            </div>
          )}
        </div>

        {/* Account Split Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <AccountNav user={user} />

          <section className="flex-1 w-full min-w-0">
            {loading && !user ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[360px]">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-medium text-gray-500">
                  Loading account details...
                </p>
              </div>
            ) : (
              children
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountProvider>
      <AccountLayoutInner>{children}</AccountLayoutInner>
    </AccountProvider>
  );
}
