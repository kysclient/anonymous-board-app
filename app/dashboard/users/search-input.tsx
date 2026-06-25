"use client";

import type React from "react";
import { memo, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useUsers } from "./users-context";

export const SearchInput = memo(function SearchInput() {
  const [inputValue, setInputValue] = useState("");
  const { setSearchTerm } = useUsers();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, setSearchTerm]);

  const handleReset = () => {
    setInputValue("");
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-md-outline-variant/70 bg-md-surface-container-lowest px-3.5 transition-colors focus-within:border-spicy/60 focus-within:ring-2 focus-within:ring-spicy/15">
        <Search className="h-[18px] w-[18px] flex-shrink-0 text-md-on-surface-variant/70" />
        <input
          type="search"
          placeholder="이름으로 멤버 검색"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 bg-transparent text-[14px] text-md-on-surface outline-none placeholder:text-md-on-surface-variant/60"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleReset}
            className="flex h-7 w-7 items-center justify-center rounded-full text-md-on-surface-variant transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
            aria-label="검색어 지우기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});
