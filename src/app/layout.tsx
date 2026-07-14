import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "외우지 말고 쪼개라! - AI 패턴 영어 기차 학습",
  description: "사용자가 동사와 테마를 선택하면, AI가 최신 영어 글을 5대 규칙에 맞게 기차 모양으로 자동 쪼개서 보여주는 초간단 학습 서비스.",
  keywords: ["영어학습", "패턴영어", "AI영어", "영어기차", "영어공부", "외우지말고쪼개라"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
