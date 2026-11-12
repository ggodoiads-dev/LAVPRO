import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LAVPRO — Sua operação sob controle",
    template: "%s · LAVPRO",
  },
  description:
    "ERP SaaS para lava-carros e estética automotiva. Agenda, ordens de serviço, equipe, estoque e financeiro em um único lugar.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: "LAVPRO",
    description: "Sua operação sob controle.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-background`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
