'use client';
import { useAppDispatch } from '@/shared/hooks/redux';
import { logout } from '@/features/auth/store/thunk';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import toast from 'react-hot-toast';
import { FaHome } from 'react-icons/fa';
import { FaFileCirclePlus, FaTableList } from 'react-icons/fa6';

const AdminHeader = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Logout Successful');
    router.push('/login');
  };

  const navigationLinks = [
    {
      icons: <FaHome />,
      path: '/'
    },

    {
      icons: <FaFileCirclePlus />,
      path: '/movies/new'
    },

    {
      icons: <FaTableList />,
      path: '/movies'
    }
  ];

  const pathname = usePathname();

  return (
    <>
      <header className=" fixed bottom-0 right-0 left-0 z-10">
        <nav className="bg-neutral-100 mx-auto mb-5 max-w-xl shadow-lg rounded-2xl p-4">
          <ul className="flex gap-x-3 justify-center items-center">
            {navigationLinks.map((val, idx) => {
              const { icons, path } = val;
              const isActive = pathname === path;
              return (
                <Link key={idx} href={path} className="nav-links">
                  <li
                    className={`nav-items relative rounded-xl text-lg hover:scale-105 hover:shadow-sm transition-all duration-300 ${
                      isActive ? 'bg-red-500 text-white' : 'bg-neutral-200 text-red-500'
                    }  p-3`}
                  >
                    {icons}
                  </li>
                </Link>
              );
            })}
            <li>
              <button
                onClick={handleLogout}
                className="bg-neutral-200 text-red-500 hover:scale-105 transition-all duration-300 rounded-lg px-3 py-2 cursor-pointer font-semibold"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
};

export default AdminHeader;
