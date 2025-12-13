"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function LangUpdater() {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language]);

  return null;
}
