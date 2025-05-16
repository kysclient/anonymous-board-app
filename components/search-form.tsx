"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function SearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchType, setSearchType] = useState(
    searchParams.get("searchType") || "title"
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("searchQuery") || ""
  );
  const [isSearching, setIsSearching] = useState(false);

  // URL 파라미터가 변경되면 상태 업데이트
  useEffect(() => {
    setSearchType(searchParams.get("searchType") || "title");
    setSearchQuery(searchParams.get("searchQuery") || "");
    setIsSearching(false);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    const params = new URLSearchParams();

    // 현재 searchParams의 모든 값을 새 params에 복사
    searchParams.forEach((value, key) => {
      // page는 제외 (검색 시 항상 첫 페이지로)
      if (key !== "page") {
        params.set(key, value);
      }
    });

    // 검색 파라미터 설정
    if (searchQuery) {
      params.set("searchType", searchType);
      params.set("searchQuery", searchQuery);
    } else {
      // 검색어가 비어있으면 검색 파라미터 제거
      params.delete("searchType");
      params.delete("searchQuery");
    }

    // 검색 시 항상 첫 페이지로 이동
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setIsSearching(true);
    const params = new URLSearchParams();

    // 현재 searchParams의 검색 관련 아닌 값만 새 params에 복사
    searchParams.forEach((value, key) => {
      if (key !== "searchType" && key !== "searchQuery") {
        params.set(key, value);
      }
    });

    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/10"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="searchType">검색 유형</Label>
          <Select
            value={searchType}
            onValueChange={setSearchType}
            disabled={isSearching}
          >
            <SelectTrigger id="searchType">
              <SelectValue placeholder="검색 유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">제목</SelectItem>
              <SelectItem value="content">내용</SelectItem>
              <SelectItem value="ip">IP 주소</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="searchQuery">검색어</Label>
          <div className="flex gap-2">
            <Input
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${
                searchType === "title"
                  ? "제목"
                  : searchType === "content"
                  ? "내용"
                  : "IP 주소"
              }(으)로 검색`}
              disabled={isSearching}
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isSearching ? "검색 중" : "검색"}
            </Button>
            {(searchQuery || searchType !== "title") && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSearching}
              >
                초기화
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
