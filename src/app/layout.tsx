import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulseboard — project tracking",
  description: "A shared, simple project tracker for the team.",
};

export const viewport: Viewport = {
  themeColor: "#0d1424",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
