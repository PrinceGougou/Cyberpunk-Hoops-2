import type { Metadata } from "next";
import { Orbitron, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap"
});

const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-geist-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Cyberpunk Hoops | Real-Time Basketball Portal",
  description: "NBA、CBA 与中国国家队实时赛程、比分、排名与官方媒体直达入口"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${orbitron.variable} ${notoSansSc.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
