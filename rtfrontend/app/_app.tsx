import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import type { AppProps } from "next/app";

const INACTIVITY_LIMIT = 45 * 60 * 1000; 

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  let timeoutId: NodeJS.Timeout;

  const handleInactivityLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    router.push("/"); 
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(handleInactivityLogout, INACTIVITY_LIMIT);
  }, [handleInactivityLogout]);

  const trackUserActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      router.push("/");
    }

    resetTimer();

    window.addEventListener("mousemove", trackUserActivity);
    window.addEventListener("keydown", trackUserActivity);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", trackUserActivity);
      window.removeEventListener("keydown", trackUserActivity);
    };
  }, [router, resetTimer, trackUserActivity]);

  return <Component {...pageProps} />;
}

export default MyApp;
