"use client";

import type React from "react";
import { memo, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useUsers } from "./users-context";

export const SearchInput = memo(function SearchInput() {
  const [inputValue, setInputValue] = useState("");
  const { setSearchTerm, searchTerm } = useUsers();

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
      <div className="m3-search">
        <Search className="h-5 w-5 flex-shrink-0 text-md-on-surface-variant" />
        <input
          type="search"
          placeholder="이름으로 멤버 검색"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleReset}
            className="m3-icon-btn h-9 w-9"
            aria-label="검색어 지우기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {searchTerm && (
        <p className="absolute -bottom-5 left-5 type-label-small text-md-on-surface-variant">
          “{searchTerm}” 검색 결과
        </p>
      )}
    </div>
  );
});
