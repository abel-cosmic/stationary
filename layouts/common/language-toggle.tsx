"use client";

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

const languages = [
  { code: "en", name: "English" },
  { code: "am", name: "አማርኛ" },
];

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    // Update HTML lang attribute
    if (typeof document !== "undefined") {
      document.documentElement.lang = langCode;
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="default"
        className="h-10 w-10 sm:h-9 sm:w-9 p-0 touch-manipulation"
        disabled
      >
        <Globe className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="h-10 w-10 sm:h-9 sm:w-9 p-0 touch-manipulation"
          title={t("common.language.currentLanguage", {
            name: currentLanguage.name,
          })}
          aria-label={t("common.language.currentLanguage", {
            name: currentLanguage.name,
          })}
        >
          <Globe className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={i18n.language === lang.code ? "bg-accent" : ""}
          >
            {lang.name}
            {i18n.language === lang.code && (
              <span className="ml-auto text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
