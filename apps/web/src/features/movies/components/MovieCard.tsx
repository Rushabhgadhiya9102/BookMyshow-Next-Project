import Image from 'next/image';
import Link from 'next/link';
import type { Movie } from '@/features/movies/types';

interface MovieCardProps {
  movies: Movie;
}

const MovieCard = ({ movies }: MovieCardProps) => {
  const { _id, poster, posterUrl, title, genres } = movies || {};
  const imageSrc =
    poster ||
    posterUrl ||
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
  const genresText = Array.isArray(genres) ? genres.join(', ') : (genres || 'N/A');

  return (
    <>
      {/* ======================================================== */}
      {/* ======================= MOVIES CARDS ====================== */}
      {/* ======================================================== */}
      
      <Link href={`/movies/${_id}`} className="card cursor-pointer">
        <div className="image rounded-lg overflow-hidden">
          <Image
            src={imageSrc}
            width={100}
            height={100}
            alt={title || 'Movie Poster'}
            className="h-120 md:h-120 lg:h-90 w-full object-cover transition-transform hover:scale-105 duration-200"
          />
        </div>
        <div className="mt-3 flex justify-between">
          <div className="content text-lg">
            <p className="font-semibold">{title}</p>
            <p className="capitalize text-red-500 font-medium text-sm">{genresText}</p>
          </div>
        </div>
      </Link>
    </>
  );
};

export default MovieCard;
