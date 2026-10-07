'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import MovieCard from '@/features/movies/components/MovieCard';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { getmovie } from '@/features/movies/store/thunk';
import { useCity } from '@/features/city/context/CityContext';
import { FiMapPin, FiFilm, FiCalendar, FiFilter } from 'react-icons/fi';

const LANGUAGES = ['All', 'Hindi', 'English', 'Gujarati', 'Marathi', 'Tamil', 'Telugu'];

export default function MoviesPage() {
  const { movies, loading } = useAppSelector((state) => state.movies);
  const dispatch = useAppDispatch();
  const { currentCity, openCityModal } = useCity();

  const [activeTab, setActiveTab] = useState<'NOW_SHOWING' | 'UPCOMING'>('NOW_SHOWING');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    dispatch(getmovie());
  }, [dispatch]);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      // Basic category check
      const isMovie = !movie.category || movie.category === 'Movie';
      if (!isMovie) return false;

      // Status tab filter
      if (activeTab === 'NOW_SHOWING') {
        const isNowShowing =
          !movie.status || movie.status === 'NOW_SHOWING' || movie.status === 'active';
        if (!isNowShowing) return false;
      } else if (activeTab === 'UPCOMING') {
        if (movie.status && movie.status !== 'UPCOMING') return false;
      }

      // Language filter
      if (selectedLanguage !== 'All') {
        const langMatches = Array.isArray(movie.language)
          ? movie.language.some((l: string) => typeof l === 'string' && l.toLowerCase() === selectedLanguage.toLowerCase())
          : typeof movie.language === 'string' &&
            movie.language.toLowerCase().includes(selectedLanguage.toLowerCase());
        if (!langMatches) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatches = movie.title?.toLowerCase().includes(query);
        const genreMatches = movie.genres?.some((g) => g.toLowerCase().includes(query));
        if (!titleMatches && !genreMatches) return false;
      }

      return true;
    });
  }, [movies, activeTab, selectedLanguage, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* City Location Banner */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              <FiMapPin className="text-red-500" />
              <span>Location-Based Cinema Discovery</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Movies in <span className="text-red-600">{currentCity}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Explore trending releases, book tickets, and view showtimes across theaters in {currentCity}.
            </p>
          </div>

          <button
            onClick={openCityModal}
            className="self-start sm:self-auto px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FiMapPin size={14} />
            <span>Change City</span>
          </button>
        </div>

        {/* Tab & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center space-x-2 bg-gray-200/80 p-1 rounded-xl self-start">
            <button
              onClick={() => setActiveTab('NOW_SHOWING')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'NOW_SHOWING'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiFilm size={15} />
              <span>Now Showing</span>
            </button>

            <button
              onClick={() => setActiveTab('UPCOMING')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'UPCOMING'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiCalendar size={15} />
              <span>Coming Soon</span>
            </button>
          </div>

          {/* Language Pills & Search Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 mr-1 flex items-center gap-1">
              <FiFilter size={12} /> Languages:
            </span>
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedLanguage === lang
                    ? 'bg-red-500 text-white shadow-2xs font-semibold'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-xs text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-medium text-gray-500">
              Loading movies in {currentCity}...
            </p>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-xs text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <FiFilm size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              No movies currently matching your filters
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Try switching your language filter or check out upcoming releases in {currentCity}.
            </p>
            <button
              onClick={() => {
                setSelectedLanguage('All');
                setSearchQuery('');
                setActiveTab('NOW_SHOWING');
              }}
              className="mt-5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filteredMovies.map((movie, idx) => (
              <MovieCard key={movie._id || movie.id || idx} movies={movie} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
