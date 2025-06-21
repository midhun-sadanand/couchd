import './globals.css';
import type { Metadata } from "next";
import Providers from "@/components/Providers";
import Layout from "@/components/Layout";

export const metadata: Metadata = {
  title: "couchd",
  description: "Next.js 14 Couchd app",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "couchd",
    description: "Next.js 14 Couchd app",
    url: "https://couchd.io/", // Replace with your actual domain
    siteName: "couchd",
    images: [
      {
        url: "../public/favicon.svg", // You'll need to create this image
        width: 1200,
        height: 630,
        alt: "couchd | conscious media consumption",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "couchd",
    description: "Next.js 14 Couchd app",
    images: ["../public/favicon.svg"], // Same image as Open Graph
    creator: "@couchd", // Replace with your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased min-h-screen bg-white text-gray-900">
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
