import Link from 'next/link';
import React, { use } from 'react';
import { CiSearch } from 'react-icons/ci';
import { IoMdMenu } from 'react-icons/io';
import Image from 'next/image';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/users/thunk';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const Header = () => {

    const dispatch = useAppDispatch();
    const router = useRouter()

    const handleLogout = async () => {

        await dispatch(logout());
        toast.success("Logout Successful");
        router.push('/LoginPage');

    }
    
  const navigationItem = [
    {
      name: 'Movies',
      path: '/client/MoviesPage'
    },
    {
      name: 'Streams',
      path: '/client/StreamsPage'
    },
    {
      name: 'Events',
      path: '/client/EventsPage'
    },
    {
      name: 'Plays',
      path: '/client/PlaysPage'
    },
    {
      name: 'Sports',
      path: '/client/SportPage'
    },
    {
      name: 'Activities',
      path: '/client/ActivitiesPage'
    }
  ];

  const secondNavigationItems = [
    {
      name: 'ListYourShow'
    },
    {
      name: 'Coparates'
    },
    {
      name: 'Offers'
    },
    {
      name: 'Gift Cards'
    }
  ];

  return (
    <>
      <header>
        <nav className="bg-white">
          <div className="container p-5 mx-auto ">
            
            {/* ======================================================== */}
            {/* ======================= FIRST PART OF THE NAVIGATION ====================== */}
            {/* ======================================================== */}

            <ul className="navbar-nav flex items-center justify-center space-x-5">
              <li className="navbar-brand">
                <Link href={'/'}>
                  <Image src='/images/bookmyshow-logo.png' width={100} height={100} className="w-28 h-9" alt="" />
                </Link>
              </li>
              <li className="flex border border-gray-200 items-center ps-2 rounded">
                <CiSearch size={20} />
                <input
                  type="search"
                  className="py-1 px-2 w-200 focus:outline-none"
                  placeholder="Search for Movies,Events,Plays,Sports and Activities"
                />
              </li>
              <li className="nav-items">
                <p>Navsari</p>
              </li>
              <li className="nav-items">
                <button onClick={handleLogout} className="bg-linear-to-r font-medium from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 py-2 px-4 rounded cursor-pointer text-white text-xs">Logout</button>
              </li>
              <li className="nav-items">
                <IoMdMenu size={25} className="text-gray-500" />
              </li>
            </ul>
          </div>
        </nav>

        {/* ======================================================== */}
        {/* ======================= SECOND PART OF THE NAVIGATION ====================== */}
        {/* ======================================================== */}

        <div className="bg-gray-100">
          <div className="flex justify-between max-w-7xl mx-auto py-2 px-15">
            <ul className="flex space-x-5 text-sm">
              {navigationItem.map((val, idx) => (
                <li key={idx} className="nav-items">
                  <Link href={val.path}>{val.name}</Link>
                </li>
              ))}
            </ul>

            <ul className="flex space-x-5 text-sm">
              {secondNavigationItems.map((val, idx) => (
                <li key={idx} className="nav-items">
                  {val.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
