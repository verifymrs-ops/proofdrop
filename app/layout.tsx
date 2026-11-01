import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://proofdrop.app"),
  title: {
    default: "ProofDrop — Cryptographic proof for everyday files",
    template: "%s · ProofDrop",
  },
  description:
    "Capture or upload a photo, notarize it with a client-side SHA-256 fingerprint and a signed timestamp, then share an immutable trust report. Free for people, built for business.",
  keywords: [
    "proof of authenticity",
    "SHA-256",
    "timestamp",
    "marketplace proof",
    "rental proof",
    "document verification",
    "forensic report",
    "client-side hashing",
  ],
  authors: [{ name: "ProofDrop" }],
  openGraph: {
    title: "ProofDrop — Cryptographic proof for everyday files",
    description:
      "Instant SHA-256 fingerprint, signed timestamp, and a shareable trust report. Privacy-first: hashing happens on your device.",
    type: "website",
    siteName: "ProofDrop",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProofDrop — Cryptographic proof for everyday files",
    description:
      "Instant SHA-256 fingerprint, signed timestamp, and a shareable trust report. Hashing happens on your device.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fcfbff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${jetbrains.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="relative min-h-dvh bg-mist text-ink antialiased">
        <AmbientBackdrop />
        <div className="relative z-10 flex min-h-dvh flex-col">
          <Navbar />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
