import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Careers · AI Front Desk Sales Closers",
    template: "%s · AI Front Desk",
  },
  description:
    "Apply for industry sales closer roles at Hearthline AI Front Desk. Live voice interview — HVAC, med spa, plumbing, auto body, and more.",
  applicationName: "AI Front Desk Careers",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AF Careers",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "AI Front Desk · Sales Closer Interviews",
    description:
      "Pick your industry seat and complete a live ~15 min voice interview.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF5EC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${instrumentSerif.variable} h-full`}
    >
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
