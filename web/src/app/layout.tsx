import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Assinar ou Comprar?",
  description: "Compare comprar jogos ou assinar o Game Pass, com preços reais da Microsoft Store (Brasil e EUA).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
