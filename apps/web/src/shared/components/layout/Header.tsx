import Link from 'next/link';
import { CiSearch } from 'react-icons/ci';
import { IoMdMenu } from 'react-icons/io';
import { FiUser, FiChevronDown } from 'react-icons/fi';
import Image from 'next/image';
import { useAppDispatch } from '@/shared/hooks/redux';
import { logout } from '@/features/auth/store/thunk';
import { useCity } from '@/features/city/context/CityContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const Header = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currentCity, openCityModal } = useCity();

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Logout Successful');
    router.push('/login');
  };

  const navigationItem = [
    {
      name: 'Movies',
      path: '/movies',
    },
    {
      name: 'Streams',
      path: '/streams',
    },
    {
      name: 'Events',
      path: '/events',
    },
    {
      name: 'Plays',
      path: '/plays',
    },
    {
      name: 'Sports',
      path: '/sports',
    },
    {
      name: 'Activities',
      path: '/activities',
    },
  ];

  const secondNavigationItems = [
    {
      name: 'ListYourShow',
    },
    {
      name: 'Corporates',
    },
    {
      name: 'Offers',
    },
    {
      name: 'Gift Cards',
    },
  ];

  return (
    <>
      <header>
        <nav className="bg-white border-b border-gray-100">
          <div className="container p-4 max-w-7xl mx-auto">
            {/* First Navigation Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-6">
                <Link href={'/'} className="shrink-0">
                  <Image
                    src="/images/bookmyshow-logo.png"
                    width={115}
                    height={36}
                    className="w-28 h-9 object-contain"
                    alt="BookMyShow"
                  />
                </Link>

                <div className="hidden sm:flex border border-gray-200 items-center px-3 py-1.5 rounded-lg w-72 md:w-96 lg:w-[480px] bg-white focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-500/10">
                  <CiSearch size={20} className="text-gray-400 shrink-0 mr-2" />
                  <input
                    type="search"
                    className="w-full text-xs text-gray-800 focus:outline-none placeholder-gray-400"
                    placeholder="Search for Movies, Events, Plays, Sports and Activities"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* City Picker Trigger */}
                <button
                  type="button"
                  onClick={openCityModal}
                  className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-red-600 transition-colors text-xs font-semibold cursor-pointer"
                  title="Select City"
                >
                  <span className="truncate max-w-[100px]">{currentCity}</span>
                  <FiChevronDown size={14} className="text-gray-400" />
                </button>

                {/* Account Hub Link */}
                <Link
                  href="/account"
                  className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg border border-gray-200 hover:border-red-400 text-gray-700 hover:text-red-600 transition-colors text-xs font-semibold"
                >
                  <FiUser size={14} />
                  <span>Account</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="bg-linear-to-r font-medium from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 py-1.5 px-3.5 rounded-lg cursor-pointer text-white text-xs transition-colors shadow-2xs"
                >
                  Logout
                </button>

                <button
                  type="button"
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer lg:hidden"
                  aria-label="Menu"
                >
                  <IoMdMenu size={24} />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Second Navigation Bar */}
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="flex justify-between max-w-7xl mx-auto py-2.5 px-4 text-xs">
            <ul className="flex space-x-6 text-gray-700 font-medium">
              {navigationItem.map((val, idx) => (
                <li key={idx} className="hover:text-red-600 transition-colors">
                  <Link href={val.path}>{val.name}</Link>
                </li>
              ))}
            </ul>

            <ul className="hidden md:flex space-x-6 text-gray-600">
              {secondNavigationItems.map((val, idx) => (
                <li key={idx} className="hover:text-red-600 transition-colors cursor-pointer">
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
