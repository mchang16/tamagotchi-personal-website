import type { Metadata } from "next";
import Pixel from "next/font/local";
import "./globals.css";

const pixel_font = Pixel({
  src: [{ path: "../public/fonts/dogica.ttf", style: "normal" }],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Michelle Chang",
  description: "Personal website designed by Michelle Chang",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel_font.variable} h-full antialiased`}>
      <body>{children}</body>
    </html>
  );
}
