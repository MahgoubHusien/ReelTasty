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
      className="flex items-center justify-center rounded-md transition-colors border"
      style={{
        height: '28px', 
        width: '28px', 
        marginLeft: '-2px', 
        borderColor: theme === "light" ? "rgb(64, 64, 64)" : "white",
        color: theme === "light" ? "rgb(64, 64, 64)" : "white",
        backgroundColor: theme === "light" ? "white" : "rgb(32, 32, 32)", // Background color matching the theme
        cursor: 'pointer',
      }}
    >
      {theme === "light" ? "☀️" : "🌙"} 
    </button>
  );
}
