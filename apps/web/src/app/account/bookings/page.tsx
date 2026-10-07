'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FiFilm,
  FiCalendar,
  FiMapPin,
  FiCreditCard,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiX,
  FiDownload,
} from 'react-icons/fi';
import { IoTicketOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { accountApi } from '@/features/account/api';
import { bookingsApi } from '@/features/shows/api';
import type { BookingItem } from '@/features/account/types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED'>('ALL');
  const [activeTicket, setActiveTicket] = useState<BookingItem | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const data = await accountApi.getBookings();
        setBookings(data);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  const handleCancelAndRefund = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? A 100% refund will be processed to your original payment method.')) {
      return;
    }
    try {
      setRefundingId(bookingId);
      await bookingsApi.requestRefund({ bookingId, reason: 'Customer requested cancellation from account' });
      toast.success('Booking cancelled and refund processed successfully!');
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'REFUNDED' } : b))
      );
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to process refund')
          : err instanceof Error
          ? err.message
          : 'Failed to process refund';
      toast.error(message);
    } finally {
      setRefundingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status?.toUpperCase() === filter;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Booking History</h2>
          <p className="text-sm text-gray-500 mt-1">
            Access past cinema tickets, show timings, seat numbers, and receipts.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          {(['ALL', 'CONFIRMED', 'CANCELLED', 'REFUNDED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-xs flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-gray-500">Loading your bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-xs text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <IoTicketOutline size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {filter === 'ALL'
              ? 'No bookings found'
              : `No ${filter.toLowerCase()} bookings found`}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Explore now showing movies and book the best seats in your favourite cinema!
          </p>
          <Link
            href="/movies"
            className="inline-block mt-5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            Explore Movies
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const movie = booking.show?.movie;
            const screen = booking.show?.screen;
            const theater = screen?.theater;
            const showTime = booking.show?.startTime
              ? new Date(booking.show.startTime).toLocaleString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Showtime TBA';

            const seatsList =
              booking.bookingSeats?.length > 0
                ? booking.bookingSeats
                    .map((s) => `${s.showSeat?.seat?.row || ''}${s.showSeat?.seat?.number || ''}`)
                    .join(', ')
                : 'General Admission';

            const isConfirmed = booking.status?.toUpperCase() === 'CONFIRMED';

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:border-red-100 transition-all overflow-hidden p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
              >
                {/* Movie & Theater Info */}
                <div className="flex items-start space-x-4 min-w-0">
                  <div className="w-16 h-22 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-400 border border-gray-200">
                    {movie?.posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiFilm size={24} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-900 text-base truncate">
                        {movie?.title || 'Movie Show'}
                      </h3>
                      {movie?.language && (
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {movie.language}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-1 text-xs text-gray-500">
                      <p className="flex items-center gap-1.5">
                        <FiMapPin className="text-red-500 shrink-0" size={13} />
                        <span className="truncate">
                          {theater?.name ? `${theater.name} (${screen?.name || 'Screen 1'})` : 'Cinema Hall'}
                          {theater?.city ? `, ${theater.city}` : ''}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <FiCalendar className="text-gray-400 shrink-0" size={13} />
                        <span>{showTime}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-gray-700 font-medium">
                        <IoTicketOutline className="text-gray-400 shrink-0" size={14} />
                        <span>Seats: {seatsList}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status, Amount, & Action */}
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block">
                      Paid
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{booking.totalAmount}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        isConfirmed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : booking.status === 'REFUNDED'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : booking.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}
                    >
                      {isConfirmed ? (
                        <FiCheckCircle size={12} />
                      ) : booking.status === 'REFUNDED' ? (
                        <FiCreditCard size={12} />
                      ) : booking.status === 'CANCELLED' ? (
                        <FiXCircle size={12} />
                      ) : (
                        <FiClock size={12} />
                      )}
                      {booking.status}
                    </span>

                    {isConfirmed && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTicket(booking)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          View Ticket
                        </button>
                        <button
                          disabled={refundingId === booking.id}
                          onClick={() => handleCancelAndRefund(booking.id)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {refundingId === booking.id ? 'Refunding...' : 'Cancel & Refund'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100 relative animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-red-600 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-200">
                  BookMyShow M-Ticket
                </span>
                <h4 className="font-bold text-lg leading-tight">
                  {activeTicket.show?.movie?.title || 'Cinema Ticket'}
                </h4>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Ticket Body */}
            <div className="p-6 space-y-4">
              <div className="text-xs space-y-1 text-gray-600">
                <p className="font-semibold text-gray-900">
                  {activeTicket.show?.screen?.theater?.name} -{' '}
                  {activeTicket.show?.screen?.name || 'Screen 1'}
                </p>
                <p>
                  {activeTicket.show?.startTime
                    ? new Date(activeTicket.show.startTime).toLocaleString()
                    : 'Showtime TBA'}
                </p>
                <p className="font-semibold text-red-600">
                  Seats:{' '}
                  {activeTicket.bookingSeats?.length > 0
                    ? activeTicket.bookingSeats
                        .map(
                          (s) =>
                            `${s.showSeat?.seat?.row || ''}${
                              s.showSeat?.seat?.number || ''
                            }`
                        )
                        .join(', ')
                    : 'General Admission'}
                </p>
              </div>

              {/* QR Code Graphic Placeholder */}
              <div className="border border-dashed border-gray-300 rounded-2xl p-4 bg-gray-50 text-center">
                <div className="w-36 h-36 mx-auto bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center shadow-2xs">
                  {/* Generated SVG QR visual */}
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full text-gray-900"
                    fill="currentColor"
                  >
                    <rect x="10" y="10" width="25" height="25" fill="black" />
                    <rect x="15" y="15" width="15" height="15" fill="white" />
                    <rect x="18" y="18" width="9" height="9" fill="black" />

                    <rect x="65" y="10" width="25" height="25" fill="black" />
                    <rect x="70" y="15" width="15" height="15" fill="white" />
                    <rect x="73" y="18" width="9" height="9" fill="black" />

                    <rect x="10" y="65" width="25" height="25" fill="black" />
                    <rect x="15" y="70" width="15" height="15" fill="white" />
                    <rect x="18" y="73" width="9" height="9" fill="black" />

                    <rect x="45" y="15" width="10" height="10" fill="black" />
                    <rect x="45" y="35" width="10" height="20" fill="black" />
                    <rect x="40" y="60" width="15" height="10" fill="black" />
                    <rect x="60" y="45" width="10" height="25" fill="black" />
                    <rect x="75" y="65" width="15" height="15" fill="black" />
                  </svg>
                </div>
                <p className="text-[11px] font-mono text-gray-500 mt-2">
                  Booking ID: {activeTicket.id.slice(0, 10).toUpperCase()}
                </p>
                <p className="text-[10px] text-gray-400">
                  Scan this pass at the cinema entrance turnstile
                </p>
              </div>

              {/* Receipt Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <FiCreditCard size={14} /> Total Paid:
                </span>
                <span className="font-bold text-gray-900 text-sm">
                  ₹{activeTicket.totalAmount}
                </span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/tickets/${activeTicket.id}`}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
                >
                  <IoTicketOutline size={15} />
                  <span>Full Ticket View</span>
                </Link>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FiDownload size={14} />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
