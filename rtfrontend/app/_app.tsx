import { useEffect } from "react";
import { useRouter } from "next/router";
import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Check if the token is missing (logged out)
    const token = localStorage.getItem("authToken");

    if (!token) {
      // If token is missing, redirect to the home page
      console.log("No token found, redirecting to home...");
      router.push("/");
    }
  }, [router]);

  return <Component {...pageProps} />;
}

export default MyApp;
