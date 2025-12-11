"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="default"
        className="h-10 w-10 sm:h-9 sm:w-9 p-0 touch-manipulation"
        disabled
      >
        <Sun className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="default"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-10 w-10 sm:h-9 sm:w-9 p-0 touch-manipulation"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 sm:h-4 sm:w-4" />
      ) : (
        <Moon className="h-5 w-5 sm:h-4 sm:w-4" />
      )}
    </Button>
  );
}

