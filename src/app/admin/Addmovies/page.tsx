'use client';
import AdminHeader from '@/components/AdminHeader';
import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { LuImagePlus } from 'react-icons/lu';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addMovie, imageUpload, updateMovie } from '@/store/movies/thunk';
import { clearSelectedMovie } from '@/store/movies/movieSlice';
import Image from 'next/image';
import toast from 'react-hot-toast';

const Addmovies = () => {
    
  // ======================================================== //
  // ======================= STATE AND HOOKS MANAGEMENT ====================== //
  // ======================================================== //

  const dispatch = useAppDispatch();
  const { loading, error, selectedMovie } = useAppSelector(state => state.movies);

  const [movie, setMovie] = useState<any>({
    cast: []
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // ======================================================== //
  // ======================= USE EFFECTS ====================== //
  // ======================================================== //

  useEffect(() => {
    if (selectedMovie) {
      setMovie({ ...selectedMovie, cast: selectedMovie.cast || [] });
      setPosterPreview(selectedMovie.poster || null);
      setBannerPreview(selectedMovie.banners || null);
    } else {
      setMovie({});
      setPosterPreview(null);
      setBannerPreview(null);
    }
  }, [selectedMovie]);

  // ======================================================== //
  // ======================= HANDLE CHANGE ====================== //
  // ======================================================== //

  const handleChange = (e: ChangeEvent) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    if (name === 'genres') {
      setMovie({ ...movie, genres: value.split(',').map(g => g.trim()) });
    } else if (name === 'language') {
      setMovie({ ...movie, language: value.split(',').map(g => g.trim()) });
    } else if (name === 'cinemas') {
      setMovie({ ...movie, cinemas: value.split(',').map(g => g.trim()) });
    } else {
      setMovie({ ...movie, [name]: value });
    }
  };

  // ======================================================== //
  // ======================= HANDLE CAST CHANGE ====================== //
  // ======================================================== //

  const handleCastChange = (index: number, e: ChangeEvent) => {
    const { name, value, files } = e.target as HTMLInputElement;
    const updatedCast = [...(movie.cast || [])];
    if (name === 'imageUrl' && files && files[0]) {
      updatedCast[index][name] = files[0];
    } else {
      updatedCast[index][name] = value;
    }
    setMovie({ ...movie, cast: updatedCast });
  };

  // ======================================================== //
  // ======================= ADD NEW CAST ====================== //
  // ======================================================== //

  const addCastMember = () => {
    setMovie({ ...movie, cast: [...(movie.cast || []), { name: '', role: '', imageUrl: '' }] });
  };

  // ======================================================== //
  // ======================= HANDLE FILE INPUT ====================== //
  // ======================================================== //

  const handleFileChange = (e: ChangeEvent) => {
    const { name, files } = e.target as HTMLInputElement;
    if (!files || files.length === 0) return;
    const previewUrl = URL.createObjectURL(files[0]);

    if (name === 'poster') {
      setPosterFile(files[0]);
      setPosterPreview(previewUrl);
    }
    if (name === 'banners') {
      setBannerFile(files[0]);
      setBannerPreview(previewUrl);
    }
  };

  // ======================================================== //
  // ======================= HANDLE SUBMIT ====================== //
  // ======================================================== //

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      let posterUrl = movie.poster;
      let bannerUrl = movie.banners;

      if (posterFile) posterUrl = await imageUpload(posterFile);
      if (bannerFile) bannerUrl = await imageUpload(bannerFile);

      const updatedCast = await Promise.all(
        (movie.cast || []).map(async (member: any) => {
          if (member.imageUrl instanceof File) {
            const uploadedUrl = await imageUpload(member.imageUrl);
            return { ...member, imageUrl: uploadedUrl };
          }
          return member;
        })
      );

      const finalData = {
        ...movie,
        poster: posterUrl,
        banners: bannerUrl,
        cast: updatedCast,
        releaseDate: movie.releaseDate || new Date().toISOString()
      };

      if (selectedMovie) {
        dispatch(updateMovie(finalData));
      } else {
        dispatch(addMovie(finalData));
      }
      setMovie({});
      toast.success(`Movie ${selectedMovie ? 'updated' : 'added'} successfully`);
      setPosterPreview(null);
      setBannerPreview(null);
      dispatch(clearSelectedMovie());
    } catch (err) {
      console.error('Error adding movie:', err);
    }
  };

  // ======================================================== //

  return (
    <div className="container px-5 mx-auto">
      <AdminHeader />
      <h2 className="text-center mt-10 font-bold text-2xl text-red-600">Add Movies</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {/* ======================= LEFT SIDE ====================== */}
          {/* ======================================================== */}
          <div className="form-item w-full p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              {/* ======================================================== */}
              {/* ======================= MOVIE TITLE ====================== */}
              {/* ======================================================== */}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-800 mb-2">
                  Movie Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  onChange={handleChange}
                  value={movie.title || ''}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-400 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>

              {/* ======================================================== */}
              {/* ======================= MOVIE CATEGORY ====================== */}
              {/* ======================================================== */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-800 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  onChange={handleChange}
                  value={movie.category || ''}
                  className="block w-full rounded-md bg-white/5 px-3 py-2 text-base outline-1 -outline-offset-1 outline-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                >
                  <option value="">---- select category ----</option>
                  <option value="Movie">Movie</option>
                  <option value="Streams">Streams</option>
                  <option value="Sports">Sports</option>
                  <option value="Events">Events</option>
                  <option value="Plays">Plays</option>
                  <option value="Activities">Activities</option>
                </select>
              </div>

              {/* ======================================================== */}
              {/* ======================= MOVIE DESCRIPTION ====================== */}
              {/* ======================================================== */}

              <div className="col-span-2">
                <label htmlFor="synopsis" className="block text-sm font-medium text-gray-800 mb-2">
                  Synopsis
                </label>
                <textarea
                  id="synopsis"
                  name="synopsis"
                  onChange={handleChange}
                  value={movie.synopsis || ''}
                  className="block w-full h-40 rounded-md bg-white/5 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-400 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>

              {/* ======================================================== */}
              {/* ======================= MOVIE GENRES ====================== */}
              {/* ======================================================== */}

              <div>
                <label htmlFor="genres" className="block text-sm font-medium text-gray-800 mb-2">
                  Genres (comma separated)
                </label>
                <input
                  id="genres"
                  name="genres"
                  type="text"
                  onChange={handleChange}
                  value={movie.genres || ''}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-400 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>

              {/* ======================================================== */}
              {/* ======================= MOVIE LANGUAGES ====================== */}
              {/* ======================================================== */}

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-800 mb-2">
                  Languages (comma separated)
                </label>
                <input
                  id="language"
                  name="language"
                  type="text"
                  onChange={handleChange}
                  value={movie.language || ''}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-400 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>

              {/* ======================================================== */}
              {/* ======================= RELEASED DATE ====================== */}
              {/* ======================================================== */}

              <div>
                <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-800 mb-2">
                  Release Date
                </label>
                <input
                  id="releaseDate"
                  name="releaseDate"
                  type="date"
                  onChange={handleChange}
                  value={movie.releaseDate || ''}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-400 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>

              {/* ======================================================== */}
              {/* ======================= CINEMAS ====================== */}
              {/* ======================================================== */}

              <div>
                <label htmlFor="cinemas" className="block text-sm font-medium text-gray-800 mb-2">
                  Cinemas (comma separated)
                </label>
                <input
                  id="cinemas"
                  name="cinemas"
                  type="text"
                  onChange={handleChange}
                  value={movie.cinemas || ''}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-400 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>

              {/* ======================================================== */}
              {/* ======================= MOVIE DURATION ====================== */}
              {/* ======================================================== */}

              <div>
                <label htmlFor="runtime" className="block text-sm font-medium text-gray-800 mb-2">
                  Runtime (min)
                </label>
                <input
                  id="runtime"
                  name="runtime"
                  type="number"
                  onChange={handleChange}
                  value={movie.runtime || ''}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-400 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>

              {/* ======================================================== */}
              {/* ======================= RATING ====================== */}
              {/* ======================================================== */}

              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-800 mb-2">
                  Rating
                </label>
                <input
                  id="rating"
                  name="rating"
                  type="number"
                  step="0.1"
                  max="5"
                  onChange={handleChange}
                  value={movie.rating || ''}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-400 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`${
                selectedMovie ? 'bg-green-500 hover:bg-green-700' : 'bg-red-500 hover:bg-red-700'
              }shadow-lg shadow-gray-400 text-white py-1 px-3 rounded-sm mt-3`}
            >
              {loading ? (selectedMovie ? 'Updating...' : ' Adding...') : selectedMovie ? 'Update Movie' : 'Add Movie'}
            </button>
            {error && <p className="text-red-600 mt-2">{error}</p>}
          </div>

          {/* ======================= RIGHT SIDE ====================== */}
          {/* ======================================================== */}

          <div className="form-item p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* ======================================================== */}
              {/* ======================= MOVIE POSTER ====================== */}
              {/* ======================================================== */}
              <div className="w-full border-2 border-red-500 p-10 rounded-lg text-center cursor-pointer">
                <label htmlFor="poster">
                  {posterPreview ? (
                    <Image
                      src={posterPreview}
                      alt="Poster Preview"
                      width={100}
                      height={100}
                      className="w-50 h-50 mx-auto object-cover rounded-md"
                    />
                  ) : (
                    <>
                      <p className="font-medium">Poster</p>
                      <LuImagePlus className="size-10 my-2 mx-auto text-red-500" />
                      <p className="font-medium">Choose movie poster image</p>
                    </>
                  )}
                  <input type="file" accept="image/*" id="poster" name="poster" onChange={handleFileChange} hidden />
                </label>
              </div>

              {/* ======================================================== */}
              {/* ======================= MOVIE BANNER ====================== */}
              {/* ======================================================== */}
              <div className="w-full border-2 border-red-500 p-10 rounded-lg text-center cursor-pointer ">
                <label htmlFor="banner">
                  {bannerPreview ? (
                    <Image
                      src={bannerPreview}
                      alt="Poster Preview"
                      width={50}
                      height={50}
                      className="w-100 h-50 object-cover rounded-md"
                    />
                  ) : (
                    <>
                      <p className="font-medium">Banner</p>
                      <LuImagePlus className="size-10 my-2 mx-auto text-red-500" />
                      <p className="font-medium">Choose movie Banner image</p>
                    </>
                  )}
                  <input type="file" accept="image/*" id="banner" name="banners" onChange={handleFileChange} hidden />
                </label>
              </div>
            </div>

            {/* ======================================================== */}
            {/* ======================= CAST SECTION ====================== */}
            {/* ======================================================== */}
            <div className="mt-5">
              <p className="font-semibold text-gray-800 mb-2">Cast Members</p>
              {movie.cast?.map((member: any, index: number) => (
                <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={member.name}
                    onChange={e => handleCastChange(index, e)}
                    className="border p-2 rounded-md"
                  />
                  <input
                    type="text"
                    name="role"
                    placeholder="Role"
                    value={member.role}
                    onChange={e => handleCastChange(index, e)}
                    className="border p-2 rounded-md"
                  />
                  <input
                    type="file"
                    name="imageUrl"
                    placeholder="Image URL"
                    onChange={e => handleCastChange(index, e)}
                    value={''}
                    className="border p-2 rounded-md"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addCastMember}
                className="bg-red-500 text-white px-2 py-1 rounded mt-2 shadow-lg shadow-gray-400"
              >
                + Add Cast
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Addmovies;
