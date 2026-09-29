import type { Metadata } from 'next';
import { lato, fredoka } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dorice Smart Academy | Inspire, Achieve, Flourish',
  description:
    'Dorice Smart Academy school portal in Kipkaren River, Kenya. Secure fee management, M-PESA payments, and Competency Based Curriculum (CBC) assessment report cards.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dorice SA',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/brand/dorice-logo-badge.png',
    apple: '/brand/dorice-logo-badge.png',
    shortcut: '/brand/dorice-logo-badge.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lato.variable} ${fredoka.variable}`}>
      <body className="min-h-screen bg-bg text-text antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
