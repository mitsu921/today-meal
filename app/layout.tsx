import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘의 식사 | 고민은 짧게, 맛있는 하루는 길게",
  description: "오늘 뭐 먹지? 한 번의 클릭으로 지금 딱 맞는 메뉴를 추천받아보세요.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  metadataBase: new URL("https://todaymeal.co.kr"),
  openGraph: {
    title: "오늘의 식사",
    description: "고민은 짧게, 맛있는 하루는 길게.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
