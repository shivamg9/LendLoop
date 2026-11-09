import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist } from "next/font/google";
import { AppHeader } from "@/components/layout/AppHeader";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { UserSync } from "@/components/providers/UserSync";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LendLoop",
  description: "Borrow what you need. Lend what you don't.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <ClerkProvider>
          <ConvexClientProvider>
            <UserSync />
            <AppHeader />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
