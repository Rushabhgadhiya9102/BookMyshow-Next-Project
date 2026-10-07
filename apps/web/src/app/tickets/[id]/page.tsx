'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiMapPin,
  FiCalendar,
  FiClock,
  FiDownload,
  FiShare2,
  FiArrowLeft,
  FiCheckCircle,
} from 'react-icons/fi';
import { IoTicketOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import apiInstance from '@/shared/lib/api-client';

interface TicketData {
  id: string;
  ticketNumber: string;
  status: string;
  qrCodePayload?: string;
  booking: {
    id: string;
    bookingNumber: string;
    totalAmount: number;
    show: {
      startTime: string;
      movie: {
        title: string;
        posterUrl: string;
        language?: string;
        certification?: string;
        durationMinutes?: number;
      };
      screen: {
        name: string;
        screenType?: string;
        theater: {
          name: string;
          city?: string;
          address?: string;
        };
      };
    };
    bookingSeats: Array<{
      seatPrice?: number;
      showSeat: {
        seat: {
          rowLabel?: string;
          seatNumber?: string;
          tier?: string;
        };
      };
    }>;
  };
}

export default function StandaloneTicketPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params?.id[0] : '';

  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    async function loadTicket() {
      try {
        setLoading(true);
        // Try tickets endpoint first
        let data: TicketData | null = null;
interface BookingFallbackResponse {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  show: TicketData['booking']['show'];
  bookingSeats: TicketData['booking']['bookingSeats'];
  tickets?: Array<{
    id: string;
    ticketNumber: string;
    status: string;
    qrCodePayload?: string;
  }>;
}

        try {
          const res = await apiInstance.get<TicketData>(`/api/v1/tickets/${id}`);
          data = res.data;
        } catch {
          // If not ticketNumber, try booking endpoint
          const res = await apiInstance.get<BookingFallbackResponse>(`/api/v1/bookings/${id}`);
          const b = res.data;
          data = {
            id: b.tickets?.[0]?.id || b.id,
            ticketNumber: b.tickets?.[0]?.ticketNumber || `TKT-${b.bookingNumber}`,
            status: b.tickets?.[0]?.status || 'ACTIVE',
            qrCodePayload: b.tickets?.[0]?.qrCodePayload,
            booking: b,
          };
        }

        setTicketData(data);
      } catch (err) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Ticket not found')
            : 'Ticket not found';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Movie Ticket - ${ticketData?.booking?.show?.movie?.title}`,
          text: `Here is my movie ticket for ${ticketData?.booking?.show?.movie?.title} at ${ticketData?.booking?.show?.screen?.theater?.name}`,
          url: window.location.href,
        });
      } catch {
        // user dismissed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Ticket link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddToCalendar = () => {
    if (!ticketData) return;
    const show = ticketData.booking.show;
    const startDate = new Date(show.startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(new Date(show.startTime).getTime() + (show.movie.durationMinutes || 120) * 60000)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, '');

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      show.movie.title + ' - Movie Showtime'
    )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
      `Tickets: ${ticketData.ticketNumber}\nSeats: ${seatsList}\nCinema: ${show.screen.theater.name}`
    )}&location=${encodeURIComponent(show.screen.theater.name + ', ' + (show.screen.theater.city || ''))}`;

    window.open(url, '_blank');
  };

  const seatsList =
    ticketData?.booking?.bookingSeats
      ?.map((b) => `${b.showSeat?.seat?.rowLabel || ''}${b.showSeat?.seat?.seatNumber || ''}`)
      ?.filter(Boolean)
      ?.join(', ') || 'Seats Confirmed';

  const qrUrl = ticketData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        ticketData.ticketNumber
      )}`
    : '';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <FiArrowLeft size={16} />
            <span>Back</span>
          </button>
          <Link
            href="/account/bookings"
            className="text-xs font-semibold text-red-600 hover:text-red-700"
          >
            My Booking History
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-100">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Retrieving admission ticket...</p>
          </div>
        ) : error || !ticketData ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-lg border border-gray-100">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoTicketOutline size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Ticket Not Available</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">{error || 'Could not locate this ticket.'}</p>
            <Link
              href="/account/bookings"
              className="inline-block mt-5 px-5 py-2.5 bg-red-600 text-white font-semibold text-xs rounded-xl shadow-xs"
            >
              Go to Bookings
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* The Ticket Voucher */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
              {/* Header */}
              <div className="bg-red-600 p-5 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-200">
                    BookMyShow Official M-Ticket
                  </span>
                  <h2 className="text-xl font-extrabold mt-0.5">
                    {ticketData.booking.show.movie.title}
                  </h2>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      ticketData.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/40'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    <FiCheckCircle size={12} />
                    {ticketData.status}
                  </span>
                </div>
              </div>

              {/* Movie and Cinema details */}
              <div className="p-6 space-y-4">
                <div className="flex gap-4 items-center">
                  {ticketData.booking.show.movie.posterUrl && (
                    <div className="relative w-16 h-24 rounded-xl overflow-hidden shadow-sm shrink-0 bg-gray-100">
                      <Image
                        src={ticketData.booking.show.movie.posterUrl}
                        alt={ticketData.booking.show.movie.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-1 text-xs text-gray-600">
                    <p className="font-semibold text-gray-900 text-sm">
                      {ticketData.booking.show.screen.theater.name}
                    </p>
                    <p className="flex items-center gap-1 text-gray-500">
                      <FiMapPin size={12} className="text-red-500 shrink-0" />
                      <span>{ticketData.booking.show.screen.name} • {ticketData.booking.show.screen.theater.city || 'India'}</span>
                    </p>
                    <p className="flex items-center gap-1 text-gray-500">
                      <FiCalendar size={12} className="text-gray-400 shrink-0" />
                      <span>{new Date(ticketData.booking.show.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </p>
                    <p className="flex items-center gap-1 text-gray-500">
                      <FiClock size={12} className="text-gray-400 shrink-0" />
                      <span>{new Date(ticketData.booking.show.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                </div>

                {/* Perforated divider */}
                <div className="relative py-2">
                  <div className="border-t-2 border-dashed border-gray-200"></div>
                  <div className="absolute -left-9 -top-1.5 w-6 h-6 bg-gray-100 rounded-full shadow-inner"></div>
                  <div className="absolute -right-9 -top-1.5 w-6 h-6 bg-gray-100 rounded-full shadow-inner"></div>
                </div>

                {/* Seats and Ticket Numbers */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">Selected Seats</span>
                    <span className="font-extrabold text-gray-900 text-sm block mt-0.5">
                      {seatsList}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">Total Paid</span>
                    <span className="font-extrabold text-emerald-600 text-sm block mt-0.5">
                      ₹{ticketData.booking.totalAmount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">Ticket Number</span>
                    <span className="font-mono font-bold text-gray-800 text-xs block mt-0.5 truncate">
                      {ticketData.ticketNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 font-semibold uppercase text-[10px]">Booking Reference</span>
                    <span className="font-mono font-bold text-gray-800 text-xs block mt-0.5 truncate">
                      {ticketData.booking.bookingNumber}
                    </span>
                  </div>
                </div>

                {/* High Contrast QR Code for Gate Scanner (Section 44) */}
                <div className="pt-2 text-center">
                  <div className="inline-block p-3 bg-white border-2 border-dashed border-gray-300 rounded-2xl shadow-sm">
                    {qrUrl ? (
                      <div className="relative w-44 h-44 mx-auto">
                        <Image
                          src={qrUrl}
                          alt="Admission QR Code"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-44 h-44 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400">
                        QR Code
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 font-medium">
                    Present this QR code at cinema entrance gate for entry
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Bar (Section 58) */}
            <div className="flex gap-2.5 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                <FiDownload size={15} />
                <span>Download / Print</span>
              </button>
              <button
                onClick={handleAddToCalendar}
                className="flex-1 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FiCalendar size={15} />
                <span>Add to Calendar</span>
              </button>
              <button
                onClick={handleShare}
                aria-label="Share Ticket"
                className="px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold rounded-xl text-xs flex items-center justify-center shadow-xs transition-all cursor-pointer"
              >
                <FiShare2 size={15} />
              </button>
            </div>
          </div>
        )}
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
