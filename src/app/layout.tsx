import type { Metadata } from 'next'; 
import ClientWrapper from './ClientWrapper';

const deploymentUrl = 'https://cryp-exc.vercel.app/'; 

export const metadata: Metadata = {
  // 1. Metadata Dasar (SEO)
  title: {
    default: 'RYPTO - Real-time Crypto Trading Platform',
    template: '%s | RYPTO' 
  },
  description: 'Track, analyze, and simulate crypto trading in real-time. Built with Next.js, Tailwind, and Supabase.',
  keywords: ['Crypto', 'Trading', 'Bitcoin', 'Ethereum', 'Real-time Chart', 'Next.js', 'Portfolio'],
  authors: [{ name: 'Raya Geandy Pratama' }],
  metadataBase: new URL(deploymentUrl),

  // 2. OpenGraph (Buat LinkedIn, Facebook, WA)
  openGraph: {
    title: 'RYPTO - Pro Crypto Tracking Platform',
    description: 'Track, analyze, and simulate crypto trading in real-time. Created by Nama Kamu.',
    url: deploymentUrl,
    siteName: 'RYPTO',
    images: [
      {
        url: '/og-image.webp', 
        width: 1200,
        height: 630,
        alt: 'RYPTO App Preview',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },

  // 3. Twitter Card (Buat Twitter/X)
  twitter: {
    card: 'summary_large_image',
    title: 'RYPTO - Pro Crypto Tracking Platform',
    description: 'Real-time crypto trading simulation built with Next.js.',
    images: ['/og-image.webp'], 
  },

  // 4. Icons (Favicon)
  icons: {
    icon: '/favicon.ico', 
    apple: '/apple-icon.png', 
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b0e11] text-white min-h-screen antialiased flex flex-col overflow-x-hidden">
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}