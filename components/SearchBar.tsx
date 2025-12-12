"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder={t("common.search.placeholder")}
        value={query}
        onChange={handleChange}
        className="pl-10 h-11 sm:h-10 text-base sm:text-sm"
      />
    </div>
  );
}
