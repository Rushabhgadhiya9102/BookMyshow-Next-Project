'use client'
import Header from '@/components/Header'
import MovieCard from '@/components/MovieCard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getmovie } from '@/store/movies/thunk';
import React, { useEffect } from 'react'

const EventsPage = () => {

    const { movies } = useAppSelector(state => state.movies);
      const filteredMovies = movies.filter(movie => movie.category === 'Events');
      const dispatch = useAppDispatch();
    
      useEffect(() => {
        dispatch(getmovie());
      }, [dispatch]);

  return (
    <>
      <Header />
      <h1 className='text-center mt-5 text-xl font-bold'>Welcome to the Events Page</h1>
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

export default EventsPage
