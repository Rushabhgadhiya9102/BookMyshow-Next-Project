'use client';
import Header from '@/components/Header';
import Image from 'next/image';
import React, { useEffect } from 'react';
import MovieCard from '@/components/MovieCard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getmovie } from '@/store/movies/thunk';
import { FaCirclePlay } from 'react-icons/fa6';
import { MdOndemandVideo, MdOutlineSportsKabaddi, MdSportsCricket } from 'react-icons/md';
import { GiVideoCamera } from 'react-icons/gi';
import { AiFillPlaySquare } from 'react-icons/ai';
import Footer from '@/components/Footer';

const HomePage = () => {
  // ======================================================== //
  // ======================= STATE AND HOOKS MANAGEMENT ====================== //
  // ======================================================== //

  const { movies } = useAppSelector(state => state.movies);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getmovie());
  }, []);

  // ======================================================== //
  // ======================= BEST EVENTS ====================== //
  // ======================================================== //

  const bestEvents = [
    {
      image: '/images/best-events-1.avif'
    },
    {
      image: '/images/best-events-2.avif'
    },
    {
      image: '/images/best-events-3.avif'
    },
    {
      image: '/images/best-events-4.avif'
    },
    {
      image: '/images/best-events-5.avif'
    }
  ];

  // ======================================================== //
  // ======================= CATEGORIES WISE FILTER ====================== //
  // ======================================================== //

  console.log(movies);
  

  const moviesCategories = movies.filter(val => val.category === 'Movie');
  const streamsCategories = movies.filter(val => val.category === 'Streams');
  const activitiesCategories = movies.filter(val => val.category === 'Activities');
  const eventsCategories = movies.filter(val => val.category === 'Events');
  const playsCategories = movies.filter(val => val.category === 'Plays');
  const sportsCategories = movies.filter(val => val.category === 'Sports');

  return (
    <>
      <Header />

      {/* ======================================================== */}
      {/* ======================= BANNER SECTION ====================== */}
      {/* ======================================================== */}

      <section className="banner-section py-5">
        <div className="container lg:max-w-7xl px-5 mx-auto">
          <Image
            src="/images/banner-img-01.avif"
            width={1000}
            height={1000}
            className="w-full h-full rounded-lg"
            alt="banner-img-01"
          />
        </div>
      </section>

      {/* ======================================================== */}
      {/* ======================= RECOMMENDED MOVIES ====================== */}
      {/* ======================================================== */}

      <section className="container lg:max-w-7xl px-5 mx-auto py-10">
        <h3 className="text-3xl font-bold text-gray-500 mb-5">
          Recommended
          <span className="text-red-500"> Movies</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-5">
          {moviesCategories.length === 0 ? (
            <div className="text-2xl text-gray-500">No Data </div>
          ) : (
            moviesCategories.slice(0, 5).map((movie, idx) => <MovieCard key={idx} movies={movie} />)
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* ======================= BANNER 2 AND LIVES EVENTS ====================== */}
      {/* ======================================================== */}
          
      <section className="banner-section py-10">
        <div className="container lg:max-w-7xl px-5 mx-auto">
          <Image
            src="/images/banner-img-02.avif"
            width={1000}
            height={1000}
            className="w-full h-full rounded-lg mb-10"
            alt="banner-img-01"
          />

          <div className="events-banner">
            <h3 className="text-3xl font-bold text-gray-500 mb-5">
              The Best Of
              <span className="text-red-500"> Live Events</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-5">
              {bestEvents.map((events, idx) => {
                const { image } = events;

                return (
                  <Image
                    key={idx}
                    src={image}
                    width={100}
                    height={100}
                    className="rounded-xl w-full h-full"
                    alt="events-images"
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* ======================= PREMIERE ====================== */}
      {/* ======================================================== */}

      <section className="premieres bg-gray-700 text-white py-10">
        <div className="container lg:max-w-7xl px-5 mx-auto">
          <div className="title flex items-center gap-x-3">
            <FaCirclePlay color="red" size={60} />
            <div>
              <h3 className="text-white font-bold text-3xl">PREMIERE</h3>
              <p className="text-white">Watch new movies at home, every Friday</p>
            </div>
          </div>

          <h3 className="text-3xl font-bold text-white mt-10">Premieres</h3>
          <p className="text-red-500 mb-1">Brand new releases every Friday</p>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-5">
            {moviesCategories.length === 0 ? (
              <div className="text-2xl text-gray-500">No Data </div>
            ) : (
              moviesCategories.slice(0, 5).map((movie, idx) => <MovieCard key={idx} movies={movie} />)
            )}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* ======================= STREAMS ====================== */}
      {/* ======================================================== */}

      <section className="container lg:max-w-7xl px-5 mx-auto py-10">
        <h3 className="text-3xl font-bold text-gray-500 mb-5 flex items-center gap-x-2">
          Streams <MdOndemandVideo className="text-red-500" />
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-5">
          {streamsCategories.length === 0 ? (
            <div className="text-2xl text-gray-500">No Data </div>
          ) : (
            streamsCategories.slice(0, 5).map((movie, idx) => <MovieCard key={idx} movies={movie} />)
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* ======================= EVENTS ====================== */}
      {/* ======================================================== */}

      <section className="container lg:max-w-7xl px-5 mx-auto py-10">
        <h3 className="text-3xl font-bold text-gray-500 mb-5 flex items-center gap-x-2">
          Events <GiVideoCamera className="text-red-500" />
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-5">
          {eventsCategories.length === 0 ? (
            <div className="text-2xl text-gray-500">No Data </div>
          ) : (
            eventsCategories.slice(0, 5).map((movie, idx) => <MovieCard key={idx} movies={movie} />)
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* ======================= PLAYS ====================== */}
      {/* ======================================================== */}

      <section className="container lg:max-w-7xl px-5 mx-auto py-10">
        <h3 className="text-3xl font-bold text-gray-500 mb-5 flex items-center gap-x-2">
          Plays <AiFillPlaySquare className="text-red-500" />
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-5">
          {playsCategories.length === 0 ? (
            <div className="text-2xl text-gray-500">No Data </div>
          ) : (
            playsCategories.slice(0, 5).map((movie, idx) => <MovieCard key={idx} movies={movie} />)
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* ======================= SPORTS ====================== */}
      {/* ======================================================== */}

      <section className="container lg:max-w-7xl px-5 mx-auto py-10">
        <h3 className="text-3xl font-bold text-gray-500 mb-5 flex items-center gap-x-2">
          Sports <MdSportsCricket className="text-red-500" />
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-5">
          {sportsCategories.length === 0 ? (
            <div className="text-2xl text-gray-500">No Data </div>
          ) : (
            sportsCategories.slice(0, 5).map((movie, idx) => <MovieCard key={idx} movies={movie} />)
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* ======================= ACTIVITIES ====================== */}
      {/* ======================================================== */}

      <section className="container lg:max-w-7xl px-5 mx-auto py-10">
        <h3 className="text-3xl font-bold text-gray-500 mb-5 flex items-center gap-x-2">
          Activities <MdOutlineSportsKabaddi className="text-red-500" />
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-5">
          {activitiesCategories.length === 0 ? (
            <div className="text-2xl text-gray-500">No Data </div>
          ) : (
            activitiesCategories.slice(0, 5).map((movie, idx) => <MovieCard key={idx} movies={movie} />)
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default HomePage;
