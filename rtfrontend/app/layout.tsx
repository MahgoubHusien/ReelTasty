"use client";  

import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./provider";
import Navbar from "@/components/ui/navbar";
import { usePathname } from "next/navigation";  

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const hideNavbarPaths = ["/auth", "/confirmEmail", "/forgotPassword", "/resetPassword"];

  const shouldShowNavbar = !hideNavbarPaths.includes(pathname);

  return (
    <html lang="en">
      <body className={`${inter.className} bg-background dark:bg-[#121212]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Conditionally render Navbar based on pathname */}
          <div className="relative min-h-screen w-full">
            {shouldShowNavbar && <Navbar />}
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}