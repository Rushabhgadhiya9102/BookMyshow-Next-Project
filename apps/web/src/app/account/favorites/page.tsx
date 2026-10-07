'use client';

import React, { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { FiHeart, FiFilm, FiTrash2, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface FavoriteMovie {
  id: string;
  title: string;
  posterUrl?: string;
  language?: string;
  genre?: string;
  rating?: number;
}

const DEFAULT_DEMO_FAVORITES: FavoriteMovie[] = [
  {
    id: 'demo-1',
    title: 'Inception',
    posterUrl: '/images/movies-01.avif',
    language: 'English',
    genre: 'Sci-Fi / Action',
    rating: 8.8,
  },
  {
    id: 'demo-2',
    title: 'Interstellar',
    posterUrl: '/images/movies-02.avif',
    language: 'English',
    genre: 'Sci-Fi / Drama',
    rating: 8.7,
  },
];

const DEFAULT_JSON = JSON.stringify(DEFAULT_DEMO_FAVORITES);

function subscribeToFavorites(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('bms_favorites_updated', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('bms_favorites_updated', callback);
  };
}

function getFavoritesSnapshot(): string {
  if (typeof window === 'undefined') return DEFAULT_JSON;
  return localStorage.getItem('bms_favorite_movies') || DEFAULT_JSON;
}

function getServerSnapshot(): string {
  return DEFAULT_JSON;
}

export default function FavoritesPage() {
  const rawFavorites = useSyncExternalStore(
    subscribeToFavorites,
    getFavoritesSnapshot,
    getServerSnapshot
  );

  const favorites = useMemo<FavoriteMovie[]>(() => {
    try {
      return JSON.parse(rawFavorites);
    } catch {
      return DEFAULT_DEMO_FAVORITES;
    }
  }, [rawFavorites]);

  const handleRemove = (id: string, title: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    try {
      localStorage.setItem('bms_favorite_movies', JSON.stringify(updated));
      window.dispatchEvent(new Event('bms_favorites_updated'));
    } catch {
      // ignore
    }
    toast.success(`Removed "${title}" from favorites`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Saved Movies & Wishlist</h2>
          <p className="text-sm text-gray-500 mt-1">
            Keep track of upcoming releases and must-watch movies.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 self-start sm:self-auto">
          {favorites.length} Saved {favorites.length === 1 ? 'Movie' : 'Movies'}
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-xs text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <FiHeart size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-900">Your wishlist is empty</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Browse through latest releases and save your favorite movies here.
          </p>
          <Link
            href="/movies"
            className="inline-block mt-5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {favorites.map((movie) => (
            <div
              key={movie.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-2/3 bg-gray-100 overflow-hidden">
                {movie.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <FiFilm size={40} />
                  </div>
                )}
                <button
                  onClick={() => handleRemove(movie.id, movie.title)}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs text-rose-600 hover:bg-white hover:scale-105 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                  title="Remove from favorites"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm truncate">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    {movie.language && <span>{movie.language}</span>}
                    {movie.genre && <span>• {movie.genre}</span>}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    href={`/movies`}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    View Shows <FiArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
