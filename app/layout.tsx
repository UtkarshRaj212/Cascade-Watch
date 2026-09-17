import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getDashboardData } from "@/lib/db/queries";
import { DashboardProvider } from "@/components/DashboardContext";
import { DashboardAppShell } from "@/components/DashboardAppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediRipple | Healthcare Supply-Chain Early Warning & Cascade Intelligence",
  description: "Decision-support system for predicting medicine stockouts and cascade ripple failures across referral healthcare networks.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialData = await getDashboardData();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-[#ededed]">
        <DashboardProvider initialData={initialData}>
          <DashboardAppShell>{children}</DashboardAppShell>
        </DashboardProvider>
      </body>
    </html>
  );
}
