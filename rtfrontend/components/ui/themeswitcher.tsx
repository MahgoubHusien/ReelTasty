"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-6 px-2 flex items-center justify-center rounded-full transition-colors border"
      style={{
        borderColor: theme === "light" ? "rgb(64, 64, 64)" : "white",
        color: theme === "light" ? "rgb(64, 64, 64)" : "white",
      }}
    >
      {theme === "light" ? "☀️" : "🌙"} 
    </button>
  );
}
