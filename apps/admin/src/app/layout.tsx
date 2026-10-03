import type { Metadata } from 'next';
import './globals.css';
import { ReduxProvider } from '@/providers/redux-provider';
import { Toaster } from 'react-hot-toast';
import { CookiesProvider } from 'next-client-cookies/server';

export const metadata: Metadata = {
  title: 'BookMyShow - Admin Dashboard',
  description: 'BookMyShow Enterprise Admin Panel'
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
            {children}
            <Toaster />
          </ReduxProvider>
        </CookiesProvider>
      </body>
    </html>
  );
}
