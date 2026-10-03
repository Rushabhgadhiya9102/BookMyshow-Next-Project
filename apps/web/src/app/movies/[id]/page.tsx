'use client';
import type { Comment as MovieComment } from '@/features/comments/types';
import type { AuthTokenPayload } from '@/features/auth/types';
import type { SeatType } from '@/features/seats/types';
import Footer from '@/shared/components/layout/Footer';
import Header from '@/shared/components/layout/Header';
import type { CommentFormState, CommentPayload } from '@/features/comments/types';
import { clearSelectedComment, setSelectedComment } from '@/features/comments/store/commentSlice';
import { addComment, deleteComment, getCommentsByMovieId, updateComment } from '@/features/comments/store/thunk';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { getmovieById } from '@/features/movies/store/thunk';
import { toggleSeat } from '@/features/seats/store/seatsSlice';
import { getSeatsByMovieId, postBookSeats } from '@/features/seats/store/thunk';
import { createStripeSession } from '@/features/payments/store/thunk';
import { createTicket } from '@/features/tickets/store/thunk';
import { jwtDecode } from 'jwt-decode';
import { useCookies } from 'next-client-cookies';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { ChangeEvent, FormEvent} from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BsPencilSquare } from 'react-icons/bs';
import { CiCalendarDate } from 'react-icons/ci';
import { FaStar, FaTrash } from 'react-icons/fa';
import { GiSpinningRibbons } from 'react-icons/gi';
import { LiaComment } from 'react-icons/lia';
import { MdEventSeat } from 'react-icons/md';

const initialCommentState: CommentFormState = {
  comment: '',
  rating: ''
};

const seatTypePrice: Record<SeatType, number> = {
  premium: 350,
  executive: 250,
  normal: 180
};

const getSeatType = (seatNumber: string): SeatType => {
  const row = seatNumber[0];
  if (['A', 'B'].includes(row)) return 'premium';
  if (['C', 'D', 'E', 'F'].includes(row)) return 'executive';
  return 'normal';
};

const MovieDetails = () => {
  // ======================================================== //
  // ======================= STATE MANAGEMENT ======================== //
  // ======================================================== //

  const { id } = useParams();
  const movieId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const [comment, setComment] = useState<CommentFormState>(initialCommentState);
  const { selectedMovie, loading } = useAppSelector(state => state.movies);
  const { bookedSeats, selectedSeats } = useAppSelector(state => state.seats);
  const { comments, selectedComment } = useAppSelector(state => state.comments);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const cookies = useCookies();
  const token = cookies.get('token');
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const seatQuery = searchParams.get('seats') || '';
  const userFromQuery = searchParams.get('user');
  const decodedUser = token ? jwtDecode<AuthTokenPayload>(token) : null;
  const userId = decodedUser?.id ?? '';
  const userName = decodedUser?.username ?? '';

  // ======================================================== //
  // ======================= USE EFFECTS ======================== //
  // ======================================================== //

  useEffect(() => {
    if (movieId) {
      dispatch(getmovieById(movieId));
      dispatch(getSeatsByMovieId(movieId));
      dispatch(getCommentsByMovieId(movieId));
    }
  }, [dispatch, movieId]);

  useEffect(() => {
    const seatsFromQuery = seatQuery ? seatQuery.split(',') : [];

    if (!paymentStatus || seatsFromQuery.length === 0 || !movieId) return;
    let bookingUserId: string | null = null;

    if (userFromQuery) {
      bookingUserId = userFromQuery;
    } else if (token) {
      const decoded = jwtDecode<AuthTokenPayload>(token);
      bookingUserId = decoded?.id ?? null;
    }

    if (!bookingUserId) return;

    if (paymentStatus === 'success') {
      toast.success('Payment Successful');
      dispatch(postBookSeats({ id: movieId, userId: bookingUserId, seats: seatsFromQuery }));
      dispatch(
        createTicket({
          movieId: movieId,
          userId: bookingUserId,
          seats: seatsFromQuery,
          amount: seatsFromQuery.reduce((total, seat) => {
            const type = getSeatType(seat);
            return total + seatTypePrice[type];
          }, 0)
        })
      );

      console.log('Seats booked:', seatsFromQuery);
      router.replace(`/movies/${movieId}`);
    }

    if (paymentStatus === 'failed') {
      toast.error('Payment Failed');
    }
  }, [dispatch, movieId, paymentStatus, router, seatQuery, token, userFromQuery]);

  // ======================================================== //
  // ======================= DURATION FORMAT FUNCTION ======================== //
  // ======================================================== //

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  // ======================================================== //
  // ======================= FORMAT DESCRIPTION FUNCTION ======================== //
  // ======================================================== //

  const formatDescription = (synopsis?: string) => {
    if (!synopsis) {
      return '';
    } else {
      return synopsis.split('\n').map((sentence, index) => (
        <li className="mb-5" key={index}>
          {sentence.trim()}
        </li>
      ));
    }
  };

  // ======================================================== //
  // ======================= SEATS LAYOUT CONFIGURATION ======================== //
  // ======================================================== //

  const layout = {
    premium: { rows: ['A', 'B'], seats: 10, price: 350 },
    executive: { rows: ['C', 'D', 'E', 'F'], seats: 12, price: 250 },
    normal: { rows: ['G', 'H', 'I', 'J'], seats: 14, price: 180 }
  };

  // ======================================================== //
  // ======================= TOTAL PRICE CALCULATION ======================== //

  const totalPrice = selectedSeats.reduce((total, seat) => {
    const type = getSeatType(seat);
    return total + seatTypePrice[type];
  }, 0);

  const isBooked = (seatNumber: string) => bookedSeats.some(s => s.seatNumber === seatNumber);

  // ======================================================== //
  // ======================= HANDLE BOOKING ======================== //
  // ======================================================== //

  const handlePayment = async () => {
    const res = await dispatch(
      createStripeSession({
        amount: totalPrice.toString(),
        movieId: movieId,
        userId: userId,
        selectedSeats: selectedSeats
      })
    );

    if (createStripeSession.fulfilled.match(res) && res.payload.url) {
      window.location.href = res.payload.url;
    }
  };

  // ======================================================== //
  // ======================= HANDLE COMMENT CHANGE ======================== //
  // ======================================================== //

  const handleCommentChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setComment({ ...comment, [name]: value });
  };

  const handleCommentSubmit = (e: FormEvent) => {
    e.preventDefault();
    const commentPayload: CommentPayload = {
      comment: comment.comment,
      rating: Number(comment.rating),
      movieId: movieId,
      userId,
      username: userName
    };

    if (selectedComment) {
      dispatch(updateComment({ ...commentPayload, _id: selectedComment._id }));
      toast.success('Comment Updated Successfully');
      dispatch(clearSelectedComment());
    } else {
      dispatch(addComment(commentPayload));
      toast.success('Comment Added Successfully');
    }
    setComment(initialCommentState);
  };

  const handleDeleteComment = (id: string) => {
    dispatch(deleteComment(id));
    if (selectedComment?._id === id) {
      dispatch(clearSelectedComment());
      setComment(initialCommentState);
    }
    toast.success('Comment Deleted Successfully');
  };

  const handleUpdateComment = (commentToEdit: MovieComment) => {
    dispatch(setSelectedComment(commentToEdit));
    setComment({
      comment: commentToEdit.comment,
      rating: String(commentToEdit.rating)
    });
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (a.userId === userId && b.userId !== userId) return -1;
    if (b.userId === userId && a.userId !== userId) return 1;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <>
      <Header />
      {loading ? (
        <p className="text-center mt-10 text-red-500">
          <GiSpinningRibbons className="animate-spin size-5 mx-auto" />
          Loading...
        </p>
      ) : !selectedMovie ? (
        <p className="text-center mt-10 text-gray-400">Movie not found.</p>
      ) : (
        <>
          <article
            className="movie-details w-full bg-cover bg-fixed scroll-smooth"
            style={{
              backgroundImage: `url(${selectedMovie.banners})`
            }}
          >
            <section className="w-full px-5 py-10 mx-auto bg-black/85">
              <div className="flex flex-col md:flex-row gap-10 w-full">
                {/* ======================================================== */}
                {/* ======================= MOVIE POSTER ======================== */}
                {/* ======================================================== */}

                <div className="w-full md:w-1/3">
                  <Image
                    src={selectedMovie.poster}
                    alt={selectedMovie.title}
                    width={100}
                    height={100}
                    className="rounded-lg shadow-lg w-70 h-100 mx-auto object-cover"
                  />
                </div>

                {/* Movie Info */}
                <div className="w-full md:w-2/3">
                  <h2 className="text-4xl font-bold mb-4 text-white">{selectedMovie.title}</h2>

                  {/* ======================================================== */}
                  {/* ======================= REVIEW SECTION ======================== */}
                  {/* ======================================================== */}

                  <div className="flex items-center w-100 justify-between bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-3 rounded-xl shadow-md mb-5">
                    <div className="flex items-center gap-3">
                      <FaStar className="text-red-500" size={24} />
                      <p className="text-xl font-semibold text-white">{selectedMovie.rating}/5</p>
                      <span className="text-gray-300 text-sm">(151.1k votes)</span>
                    </div>
                    <a
                      href="#commentSection"
                      className="bg-linear-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white px-4 py-2 rounded-lg font-medium shadow"
                    >
                      Rate Now
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedMovie.cinemas.map(cinema => (
                      <span
                        key={cinema}
                        className="px-4 py-1 bg-white capitalize text-black rounded-full shadow text-sm font-medium"
                      >
                        {cinema}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedMovie.language.map(lang => (
                      <span
                        key={lang}
                        className="px-4 py-1 text-white capitalize bg-white/20 border border-white/30 rounded-full text-sm font-medium backdrop-blur-md"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>

                  <div className="text-white capitalize">
                    {formatDuration(selectedMovie.runtime)} â€¢ {selectedMovie.genres.join(', ')} â€¢{' '}
                    {selectedMovie.releaseDate ? new Date(selectedMovie.releaseDate).toDateString() : 'TBA'}
                  </div>
                  <div className="flex flex-col lg:flex-row mt-5">
                    <a
                      href="#bookTicket"
                      className="bg-linear-to-r font-medium from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 py-2 px-4 rounded-lg text-white"
                    >
                      Book Ticket
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* ======================================================== */}
            {/* ======================= MOVIE DESCRIPTION ======================== */}
            {/* ======================================================== */}

            <section className="py-10 bg-white/95">
              <div className="contianer px-5 lg:px-0 mx-auto lg:max-w-7xl">
                <h2 className="text-3xl font-bold mb-5">About the movie</h2>
                <ul className="">{formatDescription(selectedMovie.synopsis)}</ul>
              </div>
            </section>

            {/* ======================================================== */}
            {/* ====================== MULTIPLEX SEAT LAYOUT ====================== */}
            {/* ======================================================== */}

            <section id="bookTicket" className="py-10 bg-white/95">
              <div className="contianer px-5 lg:px-0 mx-auto lg:max-w-7xl">
                <h2 className="text-3xl font-bold mb-5 flex items-center gap-x-2">
                  <MdEventSeat /> Seats Layout
                </h2>

                {/* ====================== SEAT LAYOUT ====================== */}
                {/* ======================================================== */}

                <div className="py-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="seat-items">
                      {Object.entries(layout).map(([type, info]) => {
                        const color =
                          type === 'premium' ? 'bg-purple-300' : type === 'executive' ? 'bg-blue-300' : 'bg-green-300';

                        return (
                          <div key={type} className="mb-10 text-center">
                            <h3 className="font-bold text-lg mb-4 capitalize">
                              {type} â€” â‚¹{info.price}
                            </h3>

                            {info.rows.map(row => (
                              <div key={row} className="flex items-center gap-3 mb-2">
                                {/* ====================== ROW LABEL ====================== */}
                                {/* ======================================================== */}

                                <span className="font-semibold w-8">{row}</span>

                                {/* ====================== SEATS ====================== */}
                                {/* ======================================================== */}

                                <div className="flex gap-2 mx-auto">
                                  {[...Array(info.seats)].map((_, index) => {
                                    const seatNumber = `${row}${index + 1}`;
                                    const booked = isBooked(seatNumber);
                                    const selected = selectedSeats.includes(seatNumber);

                                    {
                                      /* ====================== ASILE GAP AFTER HALF SEATS ====================== */
                                    }
                                    {
                                      /* ======================================================== */
                                    }
                                    const gap =
                                      index + 1 === Math.floor(info.seats / 2) && row ? (
                                        <span key={row + '-gap'} className="w-6"></span>
                                      ) : null;

                                    return (
                                      <div key={seatNumber} className="flex">
                                        <button
                                          disabled={booked}
                                          onClick={() => dispatch(toggleSeat(seatNumber))}
                                          className={`w-8 h-8 rounded  text-xs flex items-center justify-center
                                        ${
                                          booked
                                            ? 'bg-red-500 text-white cursor-not-allowed'
                                            : selected
                                            ? 'bg-yellow-500 cursor-pointer'
                                            : `${color} hover:opacity-80 cursor-pointer`
                                        }
                                        `}
                                        >
                                          {seatNumber}
                                        </button>
                                        {gap}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    <div className="seat-items">
                      <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                          ðŸŽŸï¸ Booking Summary
                        </h2>

                        <div className="space-y-5">
                          {/* =================== ALREADY BOOKED ================== */}
                          {/* ======================================================== */}

                          <div className="flex justify-between items-center bg-red-50 border border-red-200 rounded-xl p-4">
                            <span className="text-gray-700 font-medium text-lg">Seats Booked</span>
                            <span className="text-red-600 font-bold text-xl">{bookedSeats.length}</span>
                          </div>

                          {/* =================== SELECTED SEATS ==================== */}
                          {/* ======================================================== */}

                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-gray-700 font-medium text-lg mb-2">Selected Seats</p>
                            <p className="text-blue-600 font-semibold">
                              {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'No seats selected'}
                            </p>
                          </div>

                          {/* =================== TOTAL PRICE ================== */}
                          {/* ======================================================== */}

                          <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-xl p-4">
                            <span className="text-gray-700 font-medium text-lg">Total Price</span>
                            <span className="text-green-600 font-bold text-xl">â‚¹ {totalPrice}</span>
                          </div>

                          {/* =================== BOOK BUTTON =============== */}
                          {/* ======================================================== */}

                          {selectedSeats.length > 0 && (
                            <button
                              onClick={handlePayment}
                              className="mt-3 bg-linear-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white py-2 px-5 rounded-lg font-semibold cursor-pointer transition-colors"
                            >
                              Book Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ======================================================== */}
            {/* ======================= COMMENT SECTION ====================== */}
            {/* ======================================================== */}

            <section id="commentSection" className="comment-section bg-white/95 py-10">
              <div className="container px-5 mx-auto lg:max-w-7xl">
                <div className="title">
                  <h2 className="text-2xl font-bold mb-5 flex items-center gap-x-2">
                    <LiaComment /> Comment({comments.length})
                  </h2>
                </div>

                <div className="form-section">
                  <form action="#" method="post" onSubmit={handleCommentSubmit}>
                    <div className="flex items-center gap-4 my-3">
                      <p className="font-semibold text-red-500">Bad</p>
                      {[1, 2, 3, 4, 5].map(num => (
                        <label key={num} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="rating"
                            value={num}
                            checked={Number(comment.rating) === num}
                            onChange={handleCommentChange}
                          />
                          {num}
                        </label>
                      ))}
                      <p className="font-semibold text-green-600">Very Good</p>
                    </div>

                    <textarea
                      name="comment"
                      id="comment"
                      className="w-full h-25 border border-gray-300 rounded-lg bg-white p-3 focus:outline-none"
                      placeholder="Write your review here..."
                      value={comment.comment || ''}
                      onChange={handleCommentChange}
                    ></textarea>
                    <button className="mt-3 bg-linear-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white py-2  px-5 rounded-lg font-semibold cursor-pointer transition-colors">
                      Submit
                    </button>
                  </form>
                </div>

                <hr className="my-10 text-gray-400" />

                <h2 className="text-3xl font-medium bg-linear-to-r from-slate-800 to-slate-500 text-transparent bg-clip-text mt-10">
                  Don&apos;t just take our word
                </h2>
                <p className="text-slate-500 mt-4 max-w-2xl mb-10">
                  Hear what our users say about us. We&apos;re always looking for ways to improve. If you have a positive
                  experience with us, leave a review.
                </p>

                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedComments.length === 0 ? (
                    <p className="text-gray-500 text-xl font-medium text-center col-span-3">No Comment Post yet</p>
                  ) : (
                    sortedComments.map((val, index) => {
                      const { comment, rating, createdAt, username, _id } = val;
                      const date = new Date(createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      });

                      return (
                        <li
                          key={index}
                          className="bg-slate-100 shadow w-full max-w-[500px] space-y-4 p-3 rounded-lg text-gray-500 text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <p className="flex items-center gap-x-1">
                              <CiCalendarDate size={20} />
                              {date}
                            </p>
                            <p className="flex items-center gap-x-1">
                              <FaStar className="text-red-500" size={20} />
                              {rating}/5
                            </p>
                          </div>
                          <p>â€œ{comment}â€</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Image
                                className="h-8 w-8 rounded-full"
                                src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=50"
                                alt="userImage1"
                                width={32}
                                height={32}
                              />
                              <p className="text-gray-800 font-medium">{username}</p>
                            </div>

                            {val.userId === userId && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleDeleteComment(_id)}
                                  className="text-red-500 hover:bg-red-200 p-1 cursor-pointer rounded"
                                >
                                  <FaTrash size={15} />
                                </button>
                                <button
                                  onClick={() => handleUpdateComment(val)}
                                  className="text-indigo-500 hover:bg-indigo-200 p-1 cursor-pointer rounded"
                                >
                                  <BsPencilSquare size={15} />
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </section>
          </article>
        </>
      )}
      <Footer />
    </>
  );
};

export default MovieDetails;
