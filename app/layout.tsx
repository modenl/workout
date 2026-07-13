import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://changqing-dongyidong-70.shermanlie.chatgpt.site"),
  title: "常青动一动｜70+ 每日全身保肌",
  description: "七个温和动作覆盖全身，标准节奏语音计数，做完自动进入下一项。",
  openGraph: {
    type: "website",
    title: "常青动一动｜70+ 每日全身保肌",
    description: "七个温和动作覆盖全身，语音数拍，自动跟练。",
  },
  twitter: {
    card: "summary",
    title: "常青动一动｜70+ 每日全身保肌",
    description: "七个温和动作覆盖全身，语音数拍，自动跟练。",
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
