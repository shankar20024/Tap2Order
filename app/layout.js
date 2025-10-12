import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from 'react-hot-toast';  
import { Analytics } from '@vercel/analytics/react';
import LayoutContent from "./LayoutContent";
import Script from 'next/script';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://tap2orders.com'), 
  title: {
    template: '%s | Tap2Orders',
    default: 'Tap2Orders - Your digital menu and ordering solution',
  },
  description: 'Tap2Orders is a modern solution for restaurants to manage menus, orders, and tables efficiently.',
  keywords: [
    'restaurant', 'menu', 'ordering', 'digital menu', 
    'restaurant management', 'restaurant ordering', 'restaurant inventory', 
    'restaurant billing', 'restaurant analytics',
    'restaurant software', 'restaurant pos', 'restaurant pos system',
    'online food ordering system', 'digital restaurant solutions',
    'contactless menu', 'qr code menu', 'qr code ordering system',
    'smart restaurant management', 'cloud restaurant management',
    'restaurant automation', 'table ordering system', 'self-ordering kiosk',
    'digital dining experience', 'food ordering platform',
    'inventory management for restaurants', 'restaurant sales tracking',
    'restaurant reporting system', 'mobile restaurant app',
    'restaurant kitchen management', 'restaurant invoice system',
    'digital menu app', 'restaurant dashboard', 'tap to order', 'food tech solutions',
    'restaurant qr code ordering app', 'digital menu for cafes and bars',
    'multi-branch restaurant management system', 'restaurant billing and inventory software',
    'cloud restaurant pos with analytics'
  ],
  icons: {
    icon: '/T2O.png',
  },
  openGraph: {
    title: 'Tap2Orders - Your digital menu and ordering solution',
    description: 'Modern solution for restaurants to manage menus, orders, and tables efficiently.',
    url: 'https://tap2orders.com',
    siteName: 'Tap2Orders',
    images: [
      {
        url: '/T2O.png', // metadataBase ke saath full URL ban jaayega
        width: 800,
        height: 600,
        alt: 'Tap2Orders Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tap2Orders - Digital Menu & Ordering Solution',
    description: 'Easiest way for restaurants to manage menus, orders, and tables.',
    images: ['/T2O.png'],
  },
  alternates: {
    canonical: 'https://tap2orders.com',
  },
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-36SB826X03"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-36SB826X03');
          `}
        </Script>

        <Providers>
          <Toaster position="top-right" />
          <LayoutContent>{children}</LayoutContent>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}  