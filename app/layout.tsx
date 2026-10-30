import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RentHome — Modern PropTech Marketplace',
  description: 'Streamlined discovery, instant booking, tenant screening, and lease management for modern renters and landlords.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
