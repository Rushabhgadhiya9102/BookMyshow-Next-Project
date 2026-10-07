'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMapPin,
  FiCalendar,
  FiDownload,
  FiArrowRight,
} from 'react-icons/fi';
import { IoTicketOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import apiInstance from '@/shared/lib/api-client';
import { bookingsApi } from '@/features/shows/api';

interface BookingShowMovie {
  id: string;
  title: string;
  posterUrl: string;
  language?: string;
  certification?: string;
}

interface BookingShowScreenTheater {
  id: string;
  name: string;
  city?: string;
  address?: string;
}

interface BookingShowScreen {
  id: string;
  name: string;
  theater: BookingShowScreenTheater;
}

interface BookingShow {
  id: string;
  startTime: string;
  movie: BookingShowMovie;
  screen: BookingShowScreen;
}

interface BookingSeatItem {
  showSeat: {
    seat: {
      rowLabel?: string;
      seatNumber?: string;
      tier?: string;
    };
  };
}

interface TicketRecord {
  id: string;
  ticketNumber: string;
  status: string;
}

interface BookingDetail {
  id: string;
  bookingNumber: string;
  status: string;
  totalAmount: number;
  show: BookingShow;
  bookingSeats: BookingSeatItem[];
  tickets?: TicketRecord[];
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingId = searchParams.get('bookingId');
  const sessionId = searchParams.get('session_id') || undefined;

  const [status, setStatus] = useState<'PROCESSING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED'>('PROCESSING');
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!bookingId) {
      setStatus('FAILED');
      setErrorMessage('No booking identifier found in URL.');
      return;
    }

    let pollCount = 0;
    const maxPolls = 6;
    let timer: NodeJS.Timeout;

    const checkAndVerify = async () => {
      try {
        // Step 1: Verify payment on backend (Section 23 & 57)
        await bookingsApi.verifyPayment({
          bookingId,
          sessionId,
        });

        // Step 2: Fetch confirmed booking details
        const res = await apiInstance.get<BookingDetail>(`/api/v1/bookings/${bookingId}`);
        const data = res.data;

        if (data.status === 'CONFIRMED') {
          setBooking(data);
          setStatus('CONFIRMED');
          toast.success('Payment verified! M-Ticket generated.');
          return;
        } else if (data.status === 'PAYMENT_FAILED' || data.status === 'CANCELLED') {
          setBooking(data);
          setStatus('FAILED');
          setErrorMessage('Payment was not successful or booking was cancelled.');
          return;
        } else if (data.status === 'EXPIRED') {
          setBooking(data);
          setStatus('EXPIRED');
          setErrorMessage('The 10-minute seat hold expired before payment was completed.');
          return;
        }

        // Still PENDING: poll up to maxPolls
        pollCount++;
        if (pollCount < maxPolls) {
          timer = setTimeout(checkAndVerify, 2000);
        } else {
          setBooking(data);
          setStatus('CONFIRMED'); // default acknowledged
        }
      } catch (err) {
        pollCount++;
        if (pollCount < maxPolls) {
          timer = setTimeout(checkAndVerify, 2000);
        } else {
          setStatus('FAILED');
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Payment verification timed out.')
              : 'Payment verification timed out.';
          setErrorMessage(msg);
        }
      }
    };

    checkAndVerify();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [bookingId, sessionId]);

  const seatLabels = booking?.bookingSeats
    ?.map((bs) => `${bs.showSeat?.seat?.rowLabel || ''}${bs.showSeat?.seat?.seatNumber || ''}`)
    ?.filter(Boolean)
    ?.join(', ') || 'Seats Confirmed';

  const ticketId = booking?.tickets?.[0]?.id || booking?.id;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl w-full">
          {status === 'PROCESSING' && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Payment Processing...
              </h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                Please wait while we confirm your transaction and issue your official BookMyShow digital ticket.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                <FiClock className="animate-spin" size={12} />
                <span>Verifying with payment gateway</span>
              </div>
            </div>
          )}

          {status === 'CONFIRMED' && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <FiCheckCircle size={32} className="text-white" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full inline-block mb-1">
                  Booking Confirmed
                </span>
                <h2 className="text-2xl font-extrabold mt-1">
                  You&apos;re Going to the Movies! 🎉
                </h2>
                <p className="text-xs text-emerald-100 mt-1">
                  Booking Reference: <strong className="font-mono text-white">{booking?.bookingNumber}</strong>
                </p>
              </div>

              {/* Movie & Ticket Details Card */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex gap-4 items-center pb-6 border-b border-gray-100">
                  {booking?.show?.movie?.posterUrl && (
                    <div className="relative w-20 h-28 rounded-xl overflow-hidden shadow-md shrink-0 bg-gray-100">
                      <Image
                        src={booking.show.movie.posterUrl}
                        alt={booking.show.movie.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full">
                      {booking?.show?.movie?.certification || 'UA'} • {booking?.show?.movie?.language || 'Hindi'}
                    </span>
                    <h3 className="font-extrabold text-lg text-gray-900 leading-tight">
                      {booking?.show?.movie?.title}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FiMapPin className="text-red-500 shrink-0" size={13} />
                      <span>{booking?.show?.screen?.theater?.name} ({booking?.show?.screen?.name})</span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FiCalendar className="text-gray-400 shrink-0" size={13} />
                      <span>{booking?.show?.startTime ? new Date(booking.show.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today'}</span>
                    </p>
                  </div>
                </div>

                {/* Seat & Price Breakdown */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 uppercase font-semibold block">Seats</span>
                    <span className="font-bold text-gray-900 text-sm mt-0.5 block truncate">
                      {seatLabels}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 uppercase font-semibold block">Amount Paid</span>
                    <span className="font-extrabold text-emerald-700 text-sm mt-0.5 block">
                      ₹{booking?.totalAmount}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Link
                    href={`/tickets/${ticketId}`}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <IoTicketOutline size={18} />
                    <span>View Official M-Ticket</span>
                    <FiArrowRight size={16} />
                  </Link>

                  <div className="flex gap-2">
                    <Link
                      href="/account/bookings"
                      className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-xs text-center cursor-pointer"
                    >
                      My Booking History
                    </Link>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FiDownload size={14} />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(status === 'FAILED' || status === 'EXPIRED') && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiXCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {status === 'EXPIRED' ? 'Reservation Timed Out' : 'Payment Failed'}
              </h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                {errorMessage || 'Your payment could not be completed or the seat hold period expired.'}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.back()}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Try Again
                </button>
                <Link
                  href="/movies"
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Explore Movies
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}