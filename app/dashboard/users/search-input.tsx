"use client";

import type React from "react";
import { memo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUsers } from "./users-context";

export const SearchInput = memo(function SearchInput() {
  const [inputValue, setInputValue] = useState("");
  const { isLoading, searchUsers, resetSearch } = useUsers();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSearch = () => {
    searchUsers(inputValue);
  };

  const handleReset = () => {
    setInputValue("");
    resetSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="사용자 이름으로 검색..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="max-w-[300px] bg-background pl-8 rounded-lg"
          disabled={isLoading}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "검색 중..." : "검색"}
        </Button>
        {inputValue && (
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            초기화
          </Button>
        )}
      </div>
    </div>
  );
});
