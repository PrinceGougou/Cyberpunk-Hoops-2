import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const orbitron = localFont({
  src: [
    { path: "./fonts/orbitron-400.ttf", weight: "400", style: "normal" },
    { path: "./fonts/orbitron-700.ttf", weight: "700", style: "normal" },
    { path: "./fonts/orbitron-900.ttf", weight: "900", style: "normal" }
  ],
  variable: "--font-orbitron",
  display: "swap",
  fallback: ["Arial"]
});

export const metadata: Metadata = {
  title: "Cyberpunk Hoops | 篮球与 LOL 赛程中心",
  description: "腾讯体育 NBA/CBA、中国篮协男篮与 LoL Esports LPL、LCK、国际赛事赛程",
  applicationName: "Cyberpunk Hoops",
  keywords: ["NBA", "CBA", "篮球赛程", "LPL", "LCK", "英雄联盟赛程"],
  category: "sports",
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    title: "Cyberpunk Hoops",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#080b12"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={orbitron.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
