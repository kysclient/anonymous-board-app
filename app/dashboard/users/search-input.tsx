"use client";

import type React from "react";
import { memo, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUsers } from "./users-context";

export const SearchInput = memo(function SearchInput() {
  const [inputValue, setInputValue] = useState("");
  const { setSearchTerm, searchTerm } = useUsers();

  // 실시간 검색 (디바운싱)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300); // 300ms 디바운스

    return () => clearTimeout(timer);
  }, [inputValue, setSearchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleReset = () => {
    setInputValue("");
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="사용자 이름으로 검색... (실시간 검색)"
          value={inputValue}
          onChange={handleInputChange}
          className="bg-background pl-8 pr-10 rounded-lg"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={handleReset}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">검색어 지우기</span>
          </Button>
        )}
      </div>
      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          &quot;{searchTerm}&quot; 검색 결과
        </p>
      )}
    </div>
  );
});
