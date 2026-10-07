import type { Metadata } from 'next';
import './globals.css';
import { ReduxProvider } from '@/providers/redux-provider';
import { Toaster } from 'react-hot-toast';
import { CookiesProvider } from 'next-client-cookies/server';
import { CityProvider } from '@/features/city/context/CityContext';
import { CityModal } from '@/features/city/components/CityModal';

export const metadata: Metadata = {
  title: 'BookMyShow - Movie Tickets, Plays, Sports, Events',
  description: 'Book movie tickets, watch trailers, and check theater showtimes across India.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className='scroll-smooth'>
      <body className="antialiased">
        <CookiesProvider>
          <ReduxProvider>
            <CityProvider>
              {children}
              <CityModal />
              <Toaster />
            </CityProvider>
          </ReduxProvider>
        </CookiesProvider>
      </body>
    </html>
  );
}
