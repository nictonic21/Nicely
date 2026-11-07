import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: {
    default: "Nicelyy: say difficult things the easy way",
    template: "%s · Nicelyy",
  },
  description:
    "Angry, awkward or lost for words? Type it, paste it or say it out loud. Nicelyy turns it into a clear, calm message that's ready to send.",
  openGraph: {
    title: "Nicelyy: say difficult things the easy way",
    description:
      "Type it, paste it or say it out loud. Nicelyy turns it into a clear, calm message that's ready to send.",
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
      </body>
    </html>
  );
}
