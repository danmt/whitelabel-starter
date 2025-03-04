import type {Metadata} from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Providers from './providers';
import {Inter} from 'next/font/google';

const inter = Inter({subsets: ['latin']});

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Privy whitelabel starter repo',
  description: 'Generated by Privy',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-black`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
