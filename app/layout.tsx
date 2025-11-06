import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loan Appraisal Decision Agent",
  description: "AI-powered loan appraisal decision support system for banks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
