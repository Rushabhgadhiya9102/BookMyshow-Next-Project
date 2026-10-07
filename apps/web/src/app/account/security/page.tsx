'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiLock,
  FiShield,
  FiSmartphone,
  FiMonitor,
  FiTrash2,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { accountApi } from '@/features/account/api';
import type { SessionItem } from '@/features/account/types';

export default function SecurityPage() {
  const router = useRouter();

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoadingSessions(true);
        const data = await accountApi.getActiveSessions();
        setSessions(data);
      } catch {
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    }

    fetchSessions();
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await accountApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success(res.message || 'Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      // Redirect to login since all sessions are revoked on password change
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(
        errorObj.response?.data?.message || 'Failed to change password'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingSessionId(sessionId);
      await accountApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success('Session revoked successfully');
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(
        errorObj.response?.data?.message || 'Failed to revoke session'
      );
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleLogoutAll = async () => {
    if (
      !window.confirm(
        'Are you sure you want to sign out from ALL devices? You will be redirected to the login page.'
      )
    ) {
      return;
    }

    try {
      setLoggingOutAll(true);
      await accountApi.logoutAllDevices();
      toast.success('Signed out from all devices');
      router.push('/login');
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(
        errorObj.response?.data?.message || 'Failed to logout from all devices'
      );
      setLoggingOutAll(false);
    }
  };

  const parseUserAgent = (ua?: string | null) => {
    if (!ua) return { device: 'Unknown Device', isMobile: false };
    const lower = ua.toLowerCase();
    const isMobile =
      lower.includes('mobile') ||
      lower.includes('android') ||
      lower.includes('iphone');

    let browser = 'Web Browser';
    if (lower.includes('edg/')) browser = 'Microsoft Edge';
    else if (lower.includes('chrome/')) browser = 'Google Chrome';
    else if (lower.includes('safari/') && !lower.includes('chrome')) browser = 'Apple Safari';
    else if (lower.includes('firefox/')) browser = 'Mozilla Firefox';

    let os = 'Desktop';
    if (lower.includes('windows')) os = 'Windows PC';
    else if (lower.includes('macintosh') || lower.includes('mac os')) os = 'macOS';
    else if (lower.includes('android')) os = 'Android';
    else if (lower.includes('iphone') || lower.includes('ios')) os = 'iOS Device';
    else if (lower.includes('linux')) os = 'Linux';

    return {
      device: `${browser} on ${os}`,
      isMobile,
    };
  };

  return (
    <div className="space-y-6">
      {/* Change Password Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs">
        <div className="border-b border-gray-100 pb-5 mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FiLock className="text-red-500" /> Change Password
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Ensure your account is protected with a strong, unique password using Argon2id encryption.
            </p>
          </div>
        </div>

        <form onSubmit={submitPasswordChange} className="space-y-5 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Current Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {changingPassword ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle size={15} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Sessions & Devices */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs">
        <div className="border-b border-gray-100 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FiShield className="text-red-500" /> Active Devices & Sessions
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Devices currently signed in to your BookMyShow account. You can revoke any unfamiliar session.
            </p>
          </div>

          <button
            onClick={handleLogoutAll}
            disabled={loggingOutAll}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <FiAlertTriangle size={14} />
            <span>Logout From All Devices</span>
          </button>
        </div>

        {loadingSessions ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Loading active sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">
            No external active sessions found.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess, idx) => {
              const { device, isMobile } = parseUserAgent(sess.userAgent);
              const isCurrent = idx === 0;

              return (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCurrent
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isMobile ? <FiSmartphone size={20} /> : <FiMonitor size={20} />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {device}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sess.ipAddress ? `IP: ${sess.ipAddress} • ` : ''}
                        Signed in on {new Date(sess.createdAt).toLocaleDateString('en-US')} at{' '}
                        {new Date(sess.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      disabled={revokingSessionId === sess.id}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Revoke session"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
