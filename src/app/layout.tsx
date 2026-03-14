import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Agent Lab",
  description: "Interactive local sandbox for experimenting with simple learning agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en">
      <body className="min-h-screen bg-canvas-950 text-slate-100">{children}</body>
    </html>
  );
}
