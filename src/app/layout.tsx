import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SongForge - Create Songs in YOUR Voice with AI",
  description: "Create personalized AI-generated songs with your own voice. Clone your voice, generate lyrics, and make music in any style.",
  keywords: ["AI music", "voice cloning", "song generator", "music creation", "AI vocals"],
  authors: [{ name: "SongForge" }],
  openGraph: {
    title: "SongForge - Create Songs in YOUR Voice with AI",
    description: "Create personalized AI-generated songs with your own voice.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
