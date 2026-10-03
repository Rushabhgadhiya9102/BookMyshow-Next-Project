'use client';

import type { SignupFormValues } from '@/features/auth/types';
import { signUp } from '@/features/auth/store/thunk';
import { useAppDispatch } from '@/shared/hooks/redux';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ChangeEvent, FormEvent} from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const initialSignupValues: SignupFormValues = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user'
};

const SignUpPageView = () => {
  const [user, setUser] = useState<SignupFormValues>(initialSignupValues);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUser(prevUser => ({ ...prevUser, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void dispatch(signUp(user));
    setUser(initialSignupValues);
    toast.success('Sign Up Successfully');
    router.push('/login');
  };

  return (
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
                value={user.username}
                required
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
              />
            </div>
          </div>

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
                value={user.email}
                required
                autoComplete="email"
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
              />
            </div>
          </div>

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
                value={user.password}
                required
                autoComplete="current-password"
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm/6 font-medium text-gray-100">
              Confirm Password
            </label>
            <div className="mt-2">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                onChange={handleChange}
                value={user.confirmPassword}
                required
                autoComplete="current-password"
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm/6 font-medium text-gray-100">
              You Register as
            </label>
            <div className="mt-2">
              <select
                id="role"
                name="role"
                onChange={handleChange}
                value={user.role}
                required
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
              >
                <option className="dark:bg-neutral-900" value="user">
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

        <p className="mt-10 text-center text-sm/6 text-gray-400">
          Already a member?{' '}
          <Link href="/login" className="font-semibold text-red-400 hover:text-red-300">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPageView;
