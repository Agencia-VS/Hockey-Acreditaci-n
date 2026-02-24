import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const mtmPalma = localFont({
  src: "../public/MTMPalma67-Regular.ttf",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Accredia - Sistema de Acreditación",
  description: "Sistema de acreditación oficial para las qualifiers del mundial de Hockey 2026, Santiago de Chile.",
   icons: {
    icon: "/img/VSLogo.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mtmPalma.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
