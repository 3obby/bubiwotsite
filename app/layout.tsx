import type { Metadata } from "next";
// Temporarily comment out Google Fonts to avoid build timeout
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Use local system fonts as fallback during build issues
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
//   fallback: ['system-ui', 'arial', 'sans-serif'],
//   display: 'swap',
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
//   fallback: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
//   display: 'swap',
// });

export const metadata: Metadata = {
  title: "BTC-UBI",
  description: "wallet x account",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans antialiased`}
        style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
