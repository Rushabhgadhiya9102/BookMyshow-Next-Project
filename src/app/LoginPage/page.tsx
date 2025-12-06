'use client';
import Image from 'next/image';
import Link from 'next/link';
import React, { ChangeEvent, FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/users/thunk';
import { useRouter } from 'next/navigation';

const LoginPage = () => {

  // ======================================================== //
  // ======================= HOOKS AND STATES MANAGEMENT ====================== //
  // ======================================================== //

  const [user, setUser] = useState<any>({});
  const dispatch = useAppDispatch();
  const router = useRouter();

  // ======================================================== //
  // ======================= HANDLE CHANGE ====================== //
  // ======================================================== //

  const handleChange = (e: ChangeEvent) => {
    const { name, value } = e.target as HTMLInputElement;
    const loggedInUser = { ...user, [name]: value };
    setUser(loggedInUser);
  };

  // ======================================================== //
  // ======================= HANDLE SUBMIT ====================== //
  // ======================================================== //

  const handleSubmit = async (e: FormEvent) => {

    e.preventDefault();
    const result = await dispatch(login(user));

    if (result.meta.requestStatus === 'fulfilled') {
      const data = result.payload;

      if (data.role === 'admin') {
        router.push('/admin');
        toast.success('Login Successfully!');

      } else if (data.role === 'user') {
        router.push('/client');
        toast.success('Login Successfully!');

      } else {
        router.push('/LoginPage');
        toast.error('Login Failed');

      }
    }
    setUser({});
  };

  return (
    <>
      <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-white dark:bg-neutral-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Image
            alt="Your Company"
            src="/images/bookmyshow-logo.png"
            width={160}
            height={40}
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-5 text-center text-2xl/9 font-bold tracking-tight text-white">Sign in to your account</h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form action="#" method="POST" onSubmit={handleSubmit} className="space-y-6">
            {/* ======================================================== */}
            {/* ======================= EMAIL ======================== */}
            {/* ======================================================== */}

            <div>
              <label htmlFor="email" className="block text-sm/6 font-medium text-gray-100">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  onChange={handleChange}
                  value={user.email || ''}
                  required
                  autoComplete="email"
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>
            </div>

            {/* ======================================================== */}
            {/* ======================= PASSWORD ======================== */}
            {/* ======================================================== */}

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm/6 font-medium text-gray-100">
                  Password
                </label>
                <div className="text-sm">
                  <a href="#" className="font-semibold text-red-400 hover:text-red-300">
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  onChange={handleChange}
                  value={user.password || ''}
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm/6 font-semibold cursor-pointer text-white hover:bg-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
              >
                Sign in
              </button>
            </div>
          </form>

          {/* ========================================================================= */}
          {/* ======================= NAVIGATE LINK TO SIGN UP ======================== */}
          {/* ========================================================================= */}

          <p className="mt-10 text-center text-sm/6 text-gray-400">
            Not a member?{' '}
            <Link href="/SignupPage" className="font-semibold text-red-400 hover:text-red-300">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
