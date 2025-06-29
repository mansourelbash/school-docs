import type { Metadata } from "next";
import { El_Messiri, Almarai } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import Header from "@/components/Header";
import { ThemeProvider } from "@/contexts/ThemeContext"

const elMessiri = El_Messiri({
  subsets: ["arabic"],
  variable: "--font-el-messiri",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const almarai = Almarai({
  subsets: ["arabic"],
  variable: "--font-almarai",
  weight: ["300", "400", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "نظام إدارة الملفات المدرسية",
  description: "نظام متكامل لإدارة وتنظيم الملفات والوثائق المدرسية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${elMessiri.variable} ${almarai.variable} gulf-arabic-text antialiased`}
      >
        
        <Providers>
          {/* الهيدر يظهر في جميع الصفحات */}
     
          {children}
        </Providers>
      </body>
    </html>
  );
}
