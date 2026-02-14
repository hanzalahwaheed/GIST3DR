import type { ReactNode } from "react";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { BackgroundBeams } from "@/components/ui/background-beams";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="mx-16 m-4 flex min-h-screen gap-6 bg-gradient-to-bl from-gray-800 via-gray-900 to-black text-white">
        <BackgroundBeams />
        <Sidebar />
        <div className="mt-4 flex w-full flex-col gap-2">{children}</div>
      </body>
    </html>
  );
}
