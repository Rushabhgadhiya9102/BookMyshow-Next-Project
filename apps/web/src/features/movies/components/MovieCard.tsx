import Image from 'next/image';
import Link from 'next/link';
import type { Movie } from '@/features/movies/types';

interface MovieCardProps {
  movies: Movie;
}

const MovieCard = ({ movies }: MovieCardProps) => {
  const { _id, poster, title, genres } = movies || {};

  return (
    <>
      {/* ======================================================== */}
      {/* ======================= MOVIES CARDS ====================== */}
      {/* ======================================================== */}
      
      <Link href={`/movies/${_id}`} className="card cursor-pointer">
        <div className="image rounded-lg overflow-hidden">
          <Image
            src={poster}
            width={100}
            height={100}
            alt={title || 'Movie Poster'}
            className="h-120 md:h-120 lg:h-90 w-full object-cover transition-transform hover:scale-105 duration-200"
          />
        </div>
        <div className="mt-3 flex justify-between">
          <div className="content text-lg">
            <p className="font-semibold">{title}</p>
            <p className="capitalize text-red-500 font-medium text-sm">{genres.join(', ')}</p>
          </div>
        </div>
      </Link>
    </>
  );
};

export default MovieCard;
