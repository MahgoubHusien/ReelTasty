import { Inter } from "next/font/google";
import "./globals.css";
import Head from 'next/head';
import ClientLayout from './ClientLayout'; 

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Reel Tasty',
  description: '...',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <title>Reel Tasty</title>
      </Head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
