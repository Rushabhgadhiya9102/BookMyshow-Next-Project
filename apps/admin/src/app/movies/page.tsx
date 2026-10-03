'use client';
import type { Movie } from '@/features/movies/types';
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
      selector: row =>
        typeof row.createdBy === 'string'
          ? row.createdBy
          : row.createdBy.username || row.createdBy.name || row.createdBy._id || 'unknown',
      sortable: true
    },
    {
      name: 'Poster',
      cell: row => {
        return (
          <Image
            src={row.poster || ''}
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
            src={row.banners || ''}
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
      selector: row => row.genres.join(','),
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
          data={movies}
          pagination
          highlightOnHover
          striped
          selectableRows
        />
      </div>

      <h2 className='text-center my-5 text-2xl font-bold'>List</h2>

      {movies.map(movie => (
        <div key={movie._id} className="border p-5 mx-15 my-5">
          <h1 className="font-bold">Title: {movie.title}</h1>
            <p>Synopsis: {movie.synopsis}</p>
            <p>Genres: {movie.genres.join(', ')}</p>
            <p>Language: {movie.language.join(', ')}</p>
            <p>Cinemas: {movie.cinemas.join(', ')}</p>
            <p>Category: {movie.category}</p>
            <p>Release Date: {movie.releaseDate ? new Date(movie.releaseDate).toDateString() : 'N/A'}</p>
            <p>Runtime: {movie.runtime} minutes</p>
            <p>Rating: {movie.rating}</p>
            <div>
                <h3 className="font-bold">Cast:</h3>
                <ul>
                    {movie.cast.map((member, index) => (
                        <li key={index}>
                            Name: {member.name}, Role: {member.role}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        ))}
    </>
  );
};

export default ViewsMovies;
