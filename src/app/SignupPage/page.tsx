'use client';
import { useAppDispatch } from '@/store/hooks';
import { signUp } from '@/store/users/thunk';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { ChangeEvent, FormEvent, useState } from 'react';
import toast from 'react-hot-toast';

const SignUpPage = () => {

  // ======================================================== //
  // ======================= EFFECTS AND STATES MANAGEMENT ====================== //
  // ======================================================== //

  const [user, setUser] = useState<any>({});
  const dispatch = useAppDispatch()
  const router = useRouter()

  // ======================================================== //
  // ======================= HANDLE CHANGE ====================== //
  // ======================================================== //

  const handleChange = (e: ChangeEvent) => {

    const {name, value} = e.target as HTMLInputElement | HTMLSelectElement
    const newUser = {...user, [name]: value}
    setUser(newUser)

  };

  // ======================================================== //
  // ======================= HANDLE SUBMIT ====================== //
  // ======================================================== //

  const handleSubmit = (e:FormEvent) => {

    e.preventDefault()
    dispatch(signUp(user))
    setUser({})
    toast.success('Sign Up Successfully')
    router.push('/LoginPage')

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
          <h2 className="mt-5 text-center text-2xl/9 font-bold tracking-tight text-white">Sign up your account</h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form action="#" method="POST" onSubmit={handleSubmit} className="space-y-6">
            {/* ======================================================== */}
            {/* ======================= USER NAME ======================== */}
            {/* ======================================================== */}
            <div>
              <label htmlFor="username" className="block text-sm/6 font-medium text-gray-100">
                Username
              </label>
              <div className="mt-2">
                <input
                  id="username"
                  name="username"
                  type="text"
                  onChange={handleChange}
                  value={user.username || ''}
                  required
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="block text-sm/6 font-medium text-gray-100">
                Password
              </label>
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

            {/* ======================================================== */}
            {/* ======================= CONFIRM PASSWORD ======================== */}
            {/* ======================================================== */}

            <div>
              <label htmlFor="password" className="block text-sm/6 font-medium text-gray-100">
                Confirm Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="confirmPassword"
                  type="password"
                  onChange={handleChange}
                  value={user.confirmPassword || ''}
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>
            </div>

            {/* =================================================================== */}
            {/* ======================= ROLE REGISTERATION ======================== */}
            {/* =================================================================== */}

            <div>
              <label htmlFor="role" className="block text-sm/6 font-medium text-gray-100">
                You Register as
              </label>
              <div className="mt-2">
                <select
                  id="role"
                  name="role"
                  onChange={handleChange}
                  value={user.role || ''}
                  required
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                >
                  <option className="dark:bg-neutral-900" defaultValue="user">
                    User
                  </option>
                  <option className="dark:bg-neutral-900" value="admin">
                    Admin
                  </option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full cursor-pointer justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
              >
                Sign Up
              </button>
            </div>
          </form>

          {/* ========================================================================= */}
          {/* ======================= NAVIGATE LINK TO SIGN IN ======================== */}
          {/* ========================================================================= */}

          <p className="mt-10 text-center text-sm/6 text-gray-400">
            Already a member?{' '}
            <Link href="/LoginPage" className="font-semibold text-red-400 hover:text-red-300">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;
