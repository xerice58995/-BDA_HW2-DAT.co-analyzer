import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DAT.co MSTR 量化儀表板",
  description: "即時 MSTR 溢價率、Beta 分析與 AI 洞察",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
