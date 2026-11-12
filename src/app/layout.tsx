import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";

const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: {
    default: "Nicelyy: say difficult things the easy way",
    template: "%s · Nicelyy",
  },
  description:
    "The awkward reply. The difficult conversation. The email that needs a little less attitude. Nicelyy helps you find just the right words.",
  applicationName: "Nicelyy",
  appleWebApp: { capable: true, title: "Nicelyy", statusBarStyle: "default" },
  openGraph: {
    title: "Nicelyy: got something to say? Say it Nicelyy.",
    description:
      "Got something to say? Say it Nicelyy. Write messages, craft replies and find just the right words.",
    type: "website",
    locale: "en_GB",
  },
};

export const viewport: Viewport = {
  themeColor: "#6C4CF1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="flex min-h-screen flex-col">
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
