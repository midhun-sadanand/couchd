import './globals.css';
import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import Layout from "@/components/Layout";

export const metadata: Metadata = {
  metadataBase: new URL('https://couchd.io'),
  title: "couchd",
  description: "conscious media consumption",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "couchd",
    description: "conscious media consumption",
    url: "https://couchd.io/",
    siteName: "couchd",
    images: [
      {
        url: "/og-image.png",
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
    description: "conscious media consumption",
    images: ["/og-image.png"],
    creator: "@couchd",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="antialiased min-h-screen bg-white text-gray-900">
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
