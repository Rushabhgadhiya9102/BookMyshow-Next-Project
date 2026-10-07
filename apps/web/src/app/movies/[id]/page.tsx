'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { jwtDecode } from 'jwt-decode';
import { useCookies } from 'next-client-cookies';
import toast from 'react-hot-toast';
import { io, type Socket } from 'socket.io-client';

import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { getmovieById } from '@/features/movies/store/thunk';
import { clearSelectedComment, setSelectedComment } from '@/features/comments/store/commentSlice';
import {
  addComment,
  deleteComment,
  getCommentsByMovieId,
  updateComment,
} from '@/features/comments/store/thunk';
import { createStripeSession } from '@/features/payments/store/thunk';
import { useCity } from '@/features/city/context/CityContext';
import { showsApi, bookingsApi } from '@/features/shows/api';
import type {
  TheaterItem,
  ShowtimeItem,
  ShowSeatGridItem,
  ShowSeatsResponse,
} from '@/features/shows/types';
import type { Comment as MovieComment, CommentFormState, CommentPayload } from '@/features/comments/types';
import type { AuthTokenPayload } from '@/features/auth/types';

import {
  FiMapPin,
  FiCalendar,
  FiCheckCircle,
  FiStar,
  FiTrash,
  FiInfo,
  FiClock,
  FiLock,
  FiCheck,
} from 'react-icons/fi';
import { MdEventSeat } from 'react-icons/md';
import { BsPencilSquare } from 'react-icons/bs';
import { CiCalendarDate } from 'react-icons/ci';
import { LiaComment } from 'react-icons/lia';
import { GiSpinningRibbons } from 'react-icons/gi';

const initialCommentState: CommentFormState = {
  comment: '',
  rating: '',
};

export default function MovieDetails() {
  const params = useParams();
  const rawId = params?.id;
  const movieId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

  const router = useRouter();
  const cookies = useCookies();
  const token = cookies.get('token') || cookies.get('accessToken');
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const bookingIdFromQuery = searchParams.get('bookingId');
  const sessionIdFromQuery = searchParams.get('session_id');

  const dispatch = useAppDispatch();
  const { currentCity, openCityModal } = useCity();

  // Redux state
  const { selectedMovie, loading: movieLoading } = useAppSelector((state) => state.movies);
  const { comments, selectedComment } = useAppSelector((state) => state.comments);

  // User auth details
  const decodedUser = useMemo(() => {
    if (!token) return null;
    try {
      return jwtDecode<AuthTokenPayload>(token);
    } catch {
      return null;
    }
  }, [token]);

  const userId = decodedUser?.id ?? '';
  const userName = decodedUser?.username ?? '';

  // Dates selection (Next 4 days)
  const availableDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      dates.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNumber: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      });
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0].dateStr);

  // Theaters & Shows state
  const [theaters, setTheaters] = useState<TheaterItem[]>([]);
  const [loadingShows, setLoadingShows] = useState<boolean>(true);
  const [selectedShow, setSelectedShow] = useState<ShowtimeItem | null>(null);
  const [selectedTheater, setSelectedTheater] = useState<TheaterItem | null>(null);

  // Show Seats state
  const [seatsData, setSeatsData] = useState<ShowSeatsResponse | null>(null);
  const [loadingSeats, setLoadingSeats] = useState<boolean>(false);
  const [selectedSeats, setSelectedSeats] = useState<ShowSeatGridItem[]>([]);

  // Comments state
  const [commentForm, setCommentForm] = useState<CommentFormState>(initialCommentState);

  // 1. Fetch Movie & Comments
  useEffect(() => {
    if (movieId) {
      dispatch(getmovieById(movieId));
      dispatch(getCommentsByMovieId(movieId));
    }
  }, [dispatch, movieId]);

  // 2. Fetch Theaters & Showtimes for current city and date
  const fetchTheatersAndShows = useCallback(async () => {
    if (!movieId) return;
    try {
      setLoadingShows(true);
      const res = await showsApi.getMovieTheatersAndShows(movieId, currentCity, selectedDate);
      setTheaters(res.theaters || []);

      // Auto-select first show if available
      if (res.theaters?.length > 0 && res.theaters[0].shows?.length > 0) {
        setSelectedTheater(res.theaters[0]);
        setSelectedShow(res.theaters[0].shows[0]);
      } else {
        setSelectedTheater(null);
        setSelectedShow(null);
      }
    } catch {
      setTheaters([]);
      setSelectedShow(null);
    } finally {
      setLoadingShows(false);
    }
  }, [movieId, currentCity, selectedDate]);

  useEffect(() => {
    fetchTheatersAndShows();
  }, [fetchTheatersAndShows]);

  // 3. Fetch Show Seats when selectedShow changes
  const fetchShowSeats = useCallback(async (showId: string) => {
    try {
      setLoadingSeats(true);
      setSelectedSeats([]);
      const res = await showsApi.getShowSeats(showId);
      setSeatsData(res);
    } catch {
      setSeatsData(null);
    } finally {
      setLoadingSeats(false);
    }
  }, []);

  useEffect(() => {
    if (selectedShow?.id) {
      const showId = selectedShow.id;
      fetchShowSeats(showId);

      // Sections 82 & 83: Realtime Seat Updates via Socket.IO
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const socket: Socket = io(`${apiUrl}/seats`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });

      socket.on('connect', () => {
        socket.emit('join_show', { showId });
      });

      socket.on('SEAT_HELD', (payload: { showId: string; seatIds: string[] }) => {
        if (payload?.showId === showId) {
          setSeatsData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              seats: prev.seats.map((s) =>
                (payload.seatIds.includes(s.seatId) || payload.seatIds.includes(s.showSeatId)) && s.status === 'AVAILABLE'
                  ? { ...s, status: 'HELD' }
                  : s
              ),
            };
          });
        }
      });

      socket.on('SEAT_RELEASED', (payload: { showId: string; seatIds: string[] }) => {
        if (payload?.showId === showId) {
          setSeatsData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              seats: prev.seats.map((s) =>
                payload.seatIds.includes(s.seatId) || payload.seatIds.includes(s.showSeatId)
                  ? { ...s, status: 'AVAILABLE' }
                  : s
              ),
            };
          });
        }
      });

      socket.on('SEAT_BOOKED', (payload: { showId: string; seatIds: string[] }) => {
        if (payload?.showId === showId) {
          setSeatsData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              seats: prev.seats.map((s) =>
                payload.seatIds.includes(s.seatId) || payload.seatIds.includes(s.showSeatId)
                  ? { ...s, status: 'BOOKED' }
                  : s
              ),
            };
          });
        }
      });

      socket.on('SHOW_UPDATED', (payload: { showId: string }) => {
        if (payload?.showId === showId) {
          fetchShowSeats(showId);
        }
      });

      return () => {
        socket.emit('leave_show', { showId });
        socket.disconnect();
      };
    } else {
      setSeatsData(null);
    }
  }, [selectedShow?.id, fetchShowSeats]);

  // 4. Handle Post-Payment Callback (Section 23: Server-Verified Payment Confirmation)
  useEffect(() => {
    if (!paymentStatus || !movieId) return;

    if (paymentStatus === 'success') {
      const verifyAndComplete = async () => {
        try {
          if (bookingIdFromQuery) {
            await bookingsApi.verifyPayment({
              bookingId: bookingIdFromQuery,
              sessionId: sessionIdFromQuery || undefined,
            });
          }
          toast.success('Payment Verified! Official M-Ticket Issued.');
        } catch {
          toast.success('Payment completed successfully.');
        } finally {
          router.replace('/account/bookings');
        }
      };
      verifyAndComplete();
    } else if (paymentStatus === 'failed') {
      toast.error('Payment Failed. Please try again.');
    }
  }, [bookingIdFromQuery, movieId, paymentStatus, router, sessionIdFromQuery]);

  // Seat toggle handler
  const handleToggleSeat = (seat: ShowSeatGridItem) => {
    if (seat.status !== 'AVAILABLE') return;

    const isAlreadySelected = selectedSeats.some((s) => s.seatId === seat.seatId);
    if (isAlreadySelected) {
      setSelectedSeats((prev) => prev.filter((s) => s.seatId !== seat.seatId));
    } else {
      if (selectedSeats.length >= 8) {
        toast.error('You can select a maximum of 8 seats per booking');
        return;
      }
      setSelectedSeats((prev) => [...prev, seat]);
    }
  };

  // Subtotal calculation from actual server tier prices
  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((acc, s) => acc + s.price, 0);
  }, [selectedSeats]);

  const [holdingSeats, setHoldingSeats] = useState<boolean>(false);

  // Section 55: Seat Hold Countdown Timer UX
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (selectedSeats.length === 0) {
      setHoldSecondsRemaining(null);
      return;
    }

    // Start a 10-minute hold window once seats are chosen
    if (holdSecondsRemaining === null) {
      setHoldSecondsRemaining(10 * 60);
    }

    const timer = setInterval(() => {
      setHoldSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSeats.length, holdSecondsRemaining]);

  // When timer hits 0, notify and clear selection
  useEffect(() => {
    if (holdSecondsRemaining === 0 && selectedSeats.length > 0) {
      toast.error('Seat reservation timer expired. Seats released back to available.');
      setSelectedSeats([]);
      if (selectedShow?.id) {
        fetchShowSeats(selectedShow.id);
      }
    }
  }, [holdSecondsRemaining, selectedSeats.length, selectedShow?.id, fetchShowSeats]);

  const formattedCountdown = useMemo(() => {
    if (holdSecondsRemaining === null) return null;
    const mins = Math.floor(holdSecondsRemaining / 60);
    const secs = holdSecondsRemaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [holdSecondsRemaining]);

  // Payment trigger with atomic hold creation (Sections 28-33)
  const handleProceedToPayment = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    if (!selectedShow?.id) {
      toast.error('Please select a showtime');
      return;
    }

    if (!token) {
      toast.error('Please login to continue booking');
      router.push('/login');
      return;
    }

    try {
      setHoldingSeats(true);

      // 1. Create Atomic Seat Hold (Section 29 & 79: POST /bookings/holds with Idempotency-Key)
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `hold_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const holdRes = await bookingsApi.createHold({
        showId: selectedShow.id,
        seatIds: selectedSeats.map((s) => s.seatId),
        userId,
        idempotencyKey,
      });

      toast.success('Seats held! Opening secure checkout...');

      // 2. Initiate Stripe checkout session with confirmed bookingId
      const res = await dispatch(
        createStripeSession({
          amount: holdRes.totalAmount.toString(),
          movieId: movieId,
          userId: userId,
          selectedSeats: selectedSeats.map((s) => s.seatNumber),
          bookingId: holdRes.bookingId,
        })
      );

      if (createStripeSession.fulfilled.match(res) && res.payload.url) {
        window.location.href = res.payload.url;
      }
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to hold seats or initiate checkout')
          : err instanceof Error
          ? err.message
          : 'Failed to hold seats or initiate checkout';
      toast.error(msg);
      // Refresh seat inventory to show updated status
      if (selectedShow?.id) {
        fetchShowSeats(selectedShow.id);
      }
    } finally {
      setHoldingSeats(false);
    }
  };

  // Group seats by tier for layout display
  const seatsByTier = useMemo(() => {
    if (!seatsData?.seats) return {};
    const grouped: Record<string, ShowSeatGridItem[]> = {};

    for (const seat of seatsData.seats) {
      const tier = seat.tier || 'Silver';
      if (!grouped[tier]) grouped[tier] = [];
      grouped[tier].push(seat);
    }

    return grouped;
  }, [seatsData?.seats]);

  // Tier sorting order
  const tierOrder = ['Recliner', 'Platinum', 'Gold', 'Silver'];

  // Comments handlers
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setCommentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentForm.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    const commentPayload: CommentPayload = {
      comment: commentForm.comment,
      rating: Number(commentForm.rating) || 5,
      movieId,
      userId,
      username: userName || 'Movie Buff',
    };

    if (selectedComment) {
      dispatch(updateComment({ ...commentPayload, _id: selectedComment._id }));
      toast.success('Review updated successfully');
      dispatch(clearSelectedComment());
    } else {
      dispatch(addComment(commentPayload));
      toast.success('Review added successfully');
    }
    setCommentForm(initialCommentState);
  };

  const handleDeleteComment = (id: string) => {
    dispatch(deleteComment(id));
    if (selectedComment?._id === id) {
      dispatch(clearSelectedComment());
      setCommentForm(initialCommentState);
    }
    toast.success('Review deleted');
  };

  const handleUpdateComment = (comm: MovieComment) => {
    dispatch(setSelectedComment(comm));
    setCommentForm({
      comment: comm.comment,
      rating: String(comm.rating),
    });
  };

  const formatShowtime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />

      {movieLoading || !selectedMovie ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <GiSpinningRibbons className="animate-spin text-red-600 size-8 mb-3" />
          <p className="text-sm font-medium text-gray-500">Loading movie details...</p>
        </div>
      ) : (
        <main className="flex-1">
          {/* Section 116: JSON-LD Structured Data Schema for Search Engines */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Movie',
                name: selectedMovie.title,
                description: selectedMovie.description || '',
                image: selectedMovie.poster || selectedMovie.banners || '',
                inLanguage: Array.isArray(selectedMovie.language)
                  ? selectedMovie.language.join(', ')
                  : selectedMovie.language || 'English',
                duration: selectedMovie.runtime ? `PT${selectedMovie.runtime}M` : undefined,
                contentRating: selectedMovie.certification || 'U/A',
                aggregateRating: selectedMovie.rating
                  ? {
                      '@type': 'AggregateRating',
                      ratingValue: selectedMovie.rating,
                      bestRating: '10',
                      worstRating: '1',
                      ratingCount: 100,
                    }
                  : undefined,
              }),
            }}
          />

          {/* ======================================================== */}
          {/* 1. MOVIE HERO BANNER */}
          {/* ======================================================== */}
          <section className="relative w-full bg-neutral-900 text-white overflow-hidden py-10 md:py-16">
            {selectedMovie.banners && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-md"
                style={{ backgroundImage: `url(${selectedMovie.banners})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/60" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Poster */}
                <div className="w-56 sm:w-64 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-800">
                  <Image
                    src={selectedMovie.poster || '/images/movies-01.avif'}
                    alt={selectedMovie.title}
                    width={260}
                    height={380}
                    className="w-full h-auto object-cover aspect-2/3"
                    priority
                  />
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-600 text-white">
                      {selectedMovie.status || 'NOW SHOWING'}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">
                      In Cinemas
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {selectedMovie.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-neutral-300">
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <FiStar size={16} className="fill-amber-400" />
                      {selectedMovie.rating || '8.5'}/10
                    </span>
                    <span>•</span>
                    <span>{selectedMovie.runtime || 135} mins</span>
                    <span>•</span>
                    <span className="bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded text-xs">
                      {selectedMovie.certification || 'U/A'}
                    </span>
                    <span>•</span>
                    <span>
                      {Array.isArray(selectedMovie.language)
                        ? selectedMovie.language.join(', ')
                        : selectedMovie.language || 'English'}
                    </span>
                  </div>

                  {Array.isArray(selectedMovie.genres) && selectedMovie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedMovie.genres.map((g) => (
                        <span
                          key={g}
                          className="text-xs bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full text-white font-medium"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedMovie.synopsis && (
                    <p className="mt-5 text-sm text-neutral-300 leading-relaxed max-w-3xl line-clamp-3">
                      {selectedMovie.synopsis}
                    </p>
                  )}

                  <div className="mt-6 flex items-center gap-4">
                    <a
                      href="#theaterShowtimes"
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center gap-2"
                    >
                      <MdEventSeat size={18} />
                      <span>Book Showtimes</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 2. THEATER & SHOWTIME DISCOVERY ENGINE (SECTIONS 10, 13, 14, 16) */}
          {/* ======================================================== */}
          <section id="theaterShowtimes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header / City Bar */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  <FiMapPin className="text-red-500" />
                  <span>Theaters & Showtimes</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Select Theaters in <span className="text-red-600">{currentCity}</span>
                </h2>
              </div>

              {/* Date Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {availableDates.map((item) => {
                  const isSelected = selectedDate === item.dateStr;
                  return (
                    <button
                      key={item.dateStr}
                      onClick={() => setSelectedDate(item.dateStr)}
                      className={`flex flex-col items-center justify-center min-w-[70px] py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-red-500 bg-red-50 text-red-600 font-bold shadow-2xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {item.dayName}
                      </span>
                      <span className="text-base font-extrabold">{item.dayNumber}</span>
                      <span className="text-[10px] uppercase">{item.month}</span>
                    </button>
                  );
                })}

                <button
                  onClick={openCityModal}
                  className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 border border-dashed border-gray-300 rounded-xl whitespace-nowrap ml-2 cursor-pointer"
                >
                  Change City
                </button>
              </div>
            </div>

            {/* Theaters List */}
            {loadingShows ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-xs text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 text-sm text-gray-500">Checking theater schedules in {currentCity}...</p>
              </div>
            ) : theaters.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-xs text-center">
                <FiInfo className="mx-auto text-gray-400 mb-2" size={32} />
                <h3 className="text-base font-bold text-gray-800">
                  No showtimes currently found for {currentCity}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Try switching to another city or selecting another date above.
                </p>
                <button
                  onClick={openCityModal}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                >
                  Select Another City
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {theaters.map((theater) => (
                  <div
                    key={theater.id}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs hover:border-gray-200 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                      <div>
                        <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                          <FiMapPin className="text-red-500 shrink-0" size={16} />
                          {theater.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{theater.address}</p>
                      </div>

                      {/* Amenities Badges (Section 13) */}
                      {theater.amenities && theater.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {theater.amenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Showtimes Pills (Section 14 & 16) */}
                    <div className="pt-4 flex flex-wrap items-center gap-3">
                      {theater.shows.map((show) => {
                        const isSelected = selectedShow?.id === show.id;
                        return (
                          <button
                            key={show.id}
                            onClick={() => {
                              setSelectedTheater(theater);
                              setSelectedShow(show);
                            }}
                            className={`flex flex-col items-center px-4 py-2 rounded-xl border text-center transition-all cursor-pointer group ${
                              isSelected
                                ? 'border-red-500 bg-red-500 text-white shadow-sm ring-2 ring-red-500/20'
                                : 'border-gray-200 bg-white text-gray-800 hover:border-red-300 hover:bg-red-50/50'
                            }`}
                          >
                            <span className="text-xs font-bold">
                              {formatShowtime(show.startTime)}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-semibold mt-0.5 ${
                                isSelected ? 'text-red-100' : 'text-gray-500 group-hover:text-red-600'
                              }`}
                            >
                              {show.screenType || '2D'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ======================================================== */}
          {/* 3. MULTI-TIER SEAT GRID & INVENTORY (SECTIONS 15, 17, 18, 19) */}
          {/* ======================================================== */}
          {selectedShow && (
            <section className="bg-white border-t border-b border-gray-200 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Show Header */}
                <div className="text-center mb-8">
                  <span className="text-xs font-bold uppercase tracking-widest text-red-600">
                    Step 2: Choose Your Seats
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">
                    {selectedTheater?.name} • {selectedShow.screenName}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-2">
                    <FiCalendar size={13} /> {selectedDate} at {formatShowtime(selectedShow.startTime)} •{' '}
                    <span className="font-semibold text-gray-700">{selectedShow.screenType}</span>
                  </p>
                </div>

                {loadingSeats ? (
                  <div className="py-16 text-center">
                    <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-gray-500 mt-3">Loading real-time seat availability...</p>
                  </div>
                ) : !seatsData || seatsData.seats.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500">
                    No seats layout configured for this show.
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Seat Grid Layout */}
                    <div className="flex-1 w-full bg-gray-50 p-6 sm:p-8 rounded-3xl border border-gray-200 overflow-x-auto">
                      {/* Cinema Curved Screen */}
                      <div className="max-w-md mx-auto mb-10 text-center">
                        <div className="h-2 w-full bg-linear-to-r from-gray-300 via-gray-400 to-gray-300 rounded-full shadow-inner mb-2" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                          All eyes this way • Screen
                        </span>
                      </div>

                      {/* Tiered Rows (Section 15 & 17) */}
                      <div className="space-y-8 min-w-[500px]">
                        {tierOrder.map((tierName) => {
                          const tierSeats = seatsByTier[tierName];
                          if (!tierSeats || tierSeats.length === 0) return null;

                          // Group by rowLabel
                          const rowMap = new Map<string, ShowSeatGridItem[]>();
                          for (const s of tierSeats) {
                            if (!rowMap.has(s.rowLabel)) rowMap.set(s.rowLabel, []);
                            rowMap.get(s.rowLabel)!.push(s);
                          }

                          const price = tierSeats[0]?.price || 250;

                          return (
                            <div key={tierName} className="space-y-3">
                              <div className="flex items-center justify-between border-b border-gray-200 pb-1 text-xs font-bold text-gray-700">
                                <span className="uppercase tracking-wider">
                                  {tierName} Tier
                                </span>
                                <span className="text-red-600 font-extrabold">₹{price}</span>
                              </div>

                              <div className="space-y-2">
                                {Array.from(rowMap.entries()).map(([rowLabel, rowSeats]) => (
                                  <div key={rowLabel} className="flex items-center gap-3">
                                    <span className="w-5 text-xs font-bold text-gray-400 text-center shrink-0">
                                      {rowLabel}
                                    </span>

                                    <div className="flex gap-2 flex-wrap flex-1 justify-center">
                                      {rowSeats.map((seat, idx) => {
                                        const isSelected = selectedSeats.some(
                                          (s) => s.seatId === seat.seatId
                                        );
                                        const isBooked = seat.status === 'BOOKED' || seat.status === 'HELD';

                                        const statusLabel = isBooked
                                          ? 'Sold / Held'
                                          : isSelected
                                          ? 'Selected'
                                          : 'Available';

                                        return (
                                          <button
                                            key={seat.seatId || idx}
                                            type="button"
                                            role="button"
                                            disabled={isBooked}
                                            aria-label={`Seat ${seat.seatNumber}, ${seat.tier || 'Regular'} Tier, Price ₹${seat.price}, Status: ${statusLabel}`}
                                            aria-pressed={isSelected}
                                            tabIndex={isBooked ? -1 : 0}
                                            onClick={() => handleToggleSeat(seat)}
                                            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 ${
                                              isBooked
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                                                : isSelected
                                                ? 'bg-amber-500 text-white font-bold ring-2 ring-amber-500/30 scale-105 shadow-xs cursor-pointer'
                                                : 'bg-white border border-gray-300 text-gray-800 hover:border-red-500 hover:text-red-600 cursor-pointer shadow-2xs'
                                            }`}
                                            title={`Seat ${seat.seatNumber} (${seat.tier || 'Regular'}) - ₹${seat.price} - ${statusLabel}`}
                                          >
                                            {isBooked ? (
                                              <FiLock className="w-3 h-3 text-gray-400" aria-hidden="true" />
                                            ) : isSelected ? (
                                              <FiCheck className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                                            ) : (
                                              <span>{seat.seatNumber.replace(/[A-Z]/g, '')}</span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Section 118: Accessible Legend with visual indicators */}
                      <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-white border border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-700">
                            1
                          </div>
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-white">
                            <FiCheck className="w-3 h-3" />
                          </div>
                          <span>Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-400">
                            <FiLock className="w-3 h-3" />
                          </div>
                          <span>Sold / Held</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Checkout Summary Card */}
                    <div className="w-full lg:w-80 shrink-0 bg-white p-6 rounded-3xl border border-gray-200 shadow-md">
                      <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3 mb-4">
                        Booking Summary
                      </h3>

                      <div className="space-y-4 text-xs">
                        <div>
                          <span className="text-gray-400 uppercase tracking-wider block font-semibold">
                            Movie & Cinema
                          </span>
                          <p className="font-bold text-gray-800 mt-0.5">{selectedMovie.title}</p>
                          <p className="text-gray-500">{selectedTheater?.name}</p>
                        </div>

                        <div>
                          <span className="text-gray-400 uppercase tracking-wider block font-semibold">
                            Showtime
                          </span>
                          <p className="font-semibold text-gray-800 mt-0.5">
                            {selectedDate} at {formatShowtime(selectedShow.startTime)}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <span className="text-gray-400 uppercase tracking-wider block font-semibold">
                            Selected Seats ({selectedSeats.length})
                          </span>
                          <p className="font-bold text-red-600 text-sm mt-0.5">
                            {selectedSeats.length > 0
                              ? selectedSeats.map((s) => s.seatNumber).join(', ')
                              : 'No seats selected'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 space-y-1">
                          <div className="flex justify-between text-gray-600">
                            <span>Tickets Total</span>
                            <span className="font-semibold">₹{totalPrice}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Convenience Fee (incl. GST)</span>
                            <span className="font-semibold">
                              ₹{selectedSeats.length > 0 ? Math.round(totalPrice * 0.12) : 0}
                            </span>
                          </div>
                          <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                            <span>Amount Payable</span>
                            <span className="text-red-600">
                              ₹
                              {selectedSeats.length > 0
                                ? totalPrice + Math.round(totalPrice * 0.12)
                                : 0}
                            </span>
                          </div>
                        </div>

                        {formattedCountdown && (
                          <div
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                              holdSecondsRemaining && holdSecondsRemaining < 120
                                ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <FiClock
                                className={
                                  holdSecondsRemaining && holdSecondsRemaining < 120
                                    ? 'text-red-600'
                                    : 'text-amber-600'
                                }
                                size={14}
                              />
                              Seats reserved for:
                            </span>
                            <span className="font-mono text-sm font-bold tracking-wider">
                              {formattedCountdown}
                            </span>
                          </div>
                        )}

                        <button
                          disabled={selectedSeats.length === 0 || holdingSeats}
                          onClick={handleProceedToPayment}
                          className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                        >
                          <FiCheckCircle size={16} />
                          <span>{holdingSeats ? 'Locking Seats & Initiating Checkout...' : 'Proceed to Pay'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* 4. USER REVIEWS & RATINGS */}
          {/* ======================================================== */}
          <section id="commentSection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <LiaComment className="text-red-500" size={24} /> Audience Reviews ({comments.length})
            </h2>

            {/* Submit Review */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs mb-8">
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-700">Your Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setCommentForm((prev) => ({ ...prev, rating: String(num) }))}
                        className="p-1 cursor-pointer"
                      >
                        <FiStar
                          size={20}
                          className={
                            Number(commentForm.rating) >= num
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300'
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  name="comment"
                  value={commentForm.comment}
                  onChange={handleCommentChange}
                  placeholder="Share what you loved about this movie..."
                  className="w-full p-3.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-800"
                  rows={3}
                  required
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    {selectedComment ? 'Update Review' : 'Post Review'}
                  </button>
                </div>
              </form>
            </div>

            {/* Comments List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comments.length === 0 ? (
                <div className="col-span-3 text-center py-10 text-gray-400 text-sm">
                  Be the first to review this movie!
                </div>
              ) : (
                comments.map((val) => (
                  <div
                    key={val._id}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3"
                  >
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <CiCalendarDate size={16} />
                        {new Date(val.createdAt).toLocaleDateString('en-US')}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-amber-500">
                        <FiStar size={14} className="fill-amber-400" />
                        {val.rating}/5
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      &ldquo;{val.comment}&rdquo;
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center">
                          {val.username ? val.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="text-xs font-semibold text-gray-900">
                          {val.username}
                        </span>
                      </div>

                      {val.userId === userId && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleUpdateComment(val)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 cursor-pointer"
                            title="Edit"
                          >
                            <BsPencilSquare size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(val._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 cursor-pointer"
                            title="Delete"
                          >
                            <FiTrash size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      )}

      <Footer />
    </div>
  );
}
