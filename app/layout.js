import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from 'react-hot-toast';  
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    template: '%s | Tap2Order',
    default: 'Tap2Order - Your digital menu and ordering solution',
  },
  description: 'Tap2Order is a modern solution for restaurants to manage menus, orders, and tables efficiently.',
  keywords: ['restaurant', 'menu', 'ordering', 'digital menu', 'restaurant management', 'restaurant ordering'],
  icons: {
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E
      %3Ccircle cx='16' cy='16' r='10' fill='%23f59e0b' /%3E
      %3Ccircle cx='16' cy='16' r='14' fill='none' stroke='%23f59e0b' stroke-width='2' /%3E
    %3C/svg%3E`,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Toaster position="top-right" />
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}  