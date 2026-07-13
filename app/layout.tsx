import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://changqing-dongyidong-70.shermanlie.chatgpt.site"),
  title: "常青动一动｜70+ 每日保肌六式",
  description: "六个坐着或扶椅完成的温和动作，配慢速动画和清楚说明。",
  openGraph: {
    type: "website",
    title: "常青动一动｜70+ 每日保肌六式",
    description: "六个坐着或扶椅完成的温和动作，慢速动画，一看就会。",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "常青动一动｜70+ 每日保肌六式",
    description: "六个坐着或扶椅完成的温和动作，慢速动画，一看就会。",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4efe5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
