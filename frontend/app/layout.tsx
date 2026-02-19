import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanon - PDF Analysis",
  description: "AI-powered PDF analysis using Google Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
