import './globals.css';
import type { Metadata } from "next";
import Providers from "@/components/Providers";
import Layout from "@/components/Layout";

export const metadata: Metadata = {
  title: "Couchd",
  description: "Next.js 14 Couchd app",
  icons: { icon: '/favicon.svg' },
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
