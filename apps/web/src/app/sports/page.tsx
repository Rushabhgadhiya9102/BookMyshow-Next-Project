'use client'
import Header from '@/shared/components/layout/Header'
import MovieCard from '@/features/movies/components/MovieCard';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { getmovie } from '@/features/movies/store/thunk';
import React, { useEffect } from 'react'

const SportPage = () => {

    const { movies } = useAppSelector(state => state.movies);
      const filteredMovies = movies.filter(movie => movie.category === 'Sports');
      const dispatch = useAppDispatch();
    
      useEffect(() => {
        dispatch(getmovie());
      }, [dispatch]);

  return (
    <>
      <Header />
      <h1 className='text-center mt-5 text-xl font-bold'>Welcome to the Sports Page</h1>
      <div className="container mx-auto max-w-7xl px-5">
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-5">
          {filteredMovies.map((movie, idx) => (
            <MovieCard key={idx} movies={movie} />
          ))}
        </div>
      </div>
    </>
  )
}

export default SportPage
