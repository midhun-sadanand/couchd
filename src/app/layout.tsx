import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../app/globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const queryClient = new QueryClient();

export const metadata: Metadata = {
  title: 'Couchd',
  description: 'Next.js 14 Couchd app migration'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <html lang="en" className="h-full">
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white text-gray-900`}>
            <header className="w-full border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <h1 className="text-lg font-bold">Couchd</h1>
              <nav>
                <SignedOut>
                  <Link href="/sign-in" className="mr-4">Sign In</Link>
                  <Link href="/sign-up">Sign Up</Link>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </nav>
            </header>
            {children}
          </body>
        </html>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
