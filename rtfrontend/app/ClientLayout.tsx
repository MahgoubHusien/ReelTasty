"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/ui/navbar";
import { ThemeProvider } from "./provider";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname() || '';

  const hideNavbarPaths = ["/auth", "/confirmEmail", "/forgotPassword", "/resetPassword"];
  const shouldShowNavbar = !hideNavbarPaths.includes(pathname);

  return (
    <div className={`${inter.className} bg-background dark:bg-[#121212]`}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <div className="relative min-h-screen w-full">
          {shouldShowNavbar && <Navbar />}
          <div className="relative z-10">{children}</div>
        </div>
      </ThemeProvider>
    </div>
  );
}
