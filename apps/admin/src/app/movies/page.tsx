'use client';
import type { Movie, MovieCastMember } from '@/features/movies/types';
import AdminHeader from '@/shared/components/layout/AdminHeader';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { setSelectedMovie } from '@/features/movies/store/movieSlice';
import { deleteMovie, getmovie } from '@/features/movies/store/thunk';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import type { TableColumn } from 'react-data-table-component';
import DataTable from 'react-data-table-component';
import toast from 'react-hot-toast';

const ViewsMovies = () => {
    
  // ======================================================== //
  // ======================= STATES AND HOOKS MANAGEMENT ====================== //
  // ======================================================== //

  const dispatch = useAppDispatch();
  const { movies } = useAppSelector(state => state.movies);
  const router = useRouter();

  // ======================================================== //
  // ======================= USE EFFECTS ====================== //
  // ======================================================== //

  useEffect(() => {
    dispatch(getmovie());
  }, [dispatch]);

  // ======================================================== //
  // ======================= HANDLE DELETE ====================== //
  // ======================================================== //

  const handleDelete = (id: string) => {
    dispatch(deleteMovie(id));
    toast.success('Movie Deleted Successfully');
  };

  // ======================================================== //
  // ======================= HANDLE UPDATES ====================== //
  // ======================================================== //

  const handleUpdate = (movie: Movie) => {
    dispatch(setSelectedMovie(movie));
    router.push('/movies/new');
  };

  // ======================================================== //
  // ======================= COLUMNS ====================== //
  // ======================================================== //

  const columns: TableColumn<Movie>[] = [
    {
      name: 'Title',
      selector: row => row.title,
      sortable: true
    },
    {
      name: 'createdBy',
      selector: row => {
        if (!row.createdBy) return 'unknown';
        if (typeof row.createdBy === 'string') return row.createdBy;
        return row.createdBy.username || row.createdBy.name || row.createdBy._id || 'unknown';
      },
      sortable: true
    },
    {
      name: 'Poster',
      cell: row => {
        return (
          <Image
            src={
              row.poster ||
              row.posterUrl ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60'
            }
            alt={row.title || 'movie Poster'}
            width={50}
            height={50}
            className="object-cover rounded-lg"
          />
        );
      },
      sortable: true
    },
    {
      name: 'Banner',
      cell: row => {
        return (
          <Image
            src={
              row.banners ||
              row.backdropUrl ||
              row.poster ||
              row.posterUrl ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60'
            }
            alt={row.title || 'movie Poster'}
            width={50}
            height={50}
            className="object-cover rounded-lg"
          />
        );
      },
      sortable: true
    },
    {
      name: 'genres',
      selector: row => (Array.isArray(row.genres) ? row.genres.join(', ') : (row.genres || 'N/A')),
      sortable: true
    },
    // {
    //   name: 'Synopsis',
    //   selector: (row: Movie) => row.synopsis || '',
    //   sortable: true
    // },
    {
      name: 'Release Date',
      selector: row => row.releaseDate || '',
      sortable: true
    },
    {
      name: 'Action',
      cell: row => {
        return (
          <>
            <button onClick={() => handleDelete(row._id)} className="bg-red-500 py-1 px-2 rounded text-white">
              Delete
            </button>
            <button onClick={() => handleUpdate(row)} className="bg-indigo-600 py-1 px-2 rounded text-white">
              Update
            </button>
          </>
        );
      },
      sortable: true
    }
  ];

  return (
    <>
      <AdminHeader />
      <h1 className="text-center mt-10 font-bold">Views movies</h1>

      <div className="container mx-auto px-5">
        <DataTable
          title="Movie List"
          columns={columns}
          data={Array.isArray(movies) ? movies : []}
          pagination
          highlightOnHover
          striped
          selectableRows
        />
      </div>

      <h2 className='text-center my-5 text-2xl font-bold'>List</h2>

      {(Array.isArray(movies) ? movies : []).map(movie => (
        <div key={movie._id} className="border p-5 mx-15 my-5 rounded-lg shadow-sm">
          <h1 className="font-bold text-xl">Title: {movie.title}</h1>
          <p>Synopsis: {movie.synopsis || movie.description || 'N/A'}</p>
          <p>Genres: {Array.isArray(movie.genres) ? movie.genres.join(', ') : (movie.genres || 'N/A')}</p>
          <p>Language: {Array.isArray(movie.language) ? movie.language.join(', ') : (movie.language || 'N/A')}</p>
          <p>Cinemas: {Array.isArray(movie.cinemas) ? movie.cinemas.join(', ') : (movie.cinemas || 'N/A')}</p>
          <p>Category: {movie.category || 'Movie'}</p>
          <p>Release Date: {movie.releaseDate ? new Date(movie.releaseDate).toDateString() : 'N/A'}</p>
          <p>Runtime: {movie.runtime ?? movie.durationMinutes ?? 'N/A'} minutes</p>
          <p>Rating: {movie.rating ?? 'N/A'}</p>
          <div>
            <h3 className="font-bold">Cast:</h3>
            <ul className="list-disc list-inside">
              {Array.isArray(movie.cast) && movie.cast.length > 0 ? (
                movie.cast.map((member: MovieCastMember, index: number) => (
                  <li key={index}>
                    Name: {member?.name || 'Unknown'}, Role: {member?.role || 'Cast'}
                  </li>
                ))
              ) : (
                <li>No cast listed</li>
              )}
            </ul>
          </div>
        </div>
      ))}
    </>
  );
};

export default ViewsMovies;
