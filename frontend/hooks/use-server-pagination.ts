"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/utils/axios";

interface UseServerPaginationResult<T> {
  items: T[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  search: string;
  setSearch: (search: string) => void;
  setCurrentPage: (page: number) => void;
  refetch: () => void;
}

export function useServerPagination<T>(
  url: string,
  pageSize: number = 10,
  extraParams?: Record<string, string>,
  enabled: boolean = true
): UseServerPaginationResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearchRaw] = useState("");
  const fetchIdRef = useRef(0);
  const prevUrlRef = useRef(url);

  // Reset to page 1 when URL changes (e.g. filter params change)
  useEffect(() => {
    if (prevUrlRef.current !== url) {
      prevUrlRef.current = url;
      setCurrentPage(1);
    }
  }, [url]);

  const setSearch = useCallback((value: string) => {
    setSearchRaw(value);
    setCurrentPage(1);
  }, []);

  const fetchData = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);

    try {
      const skip = (currentPage - 1) * pageSize;
      const params = new URLSearchParams();
      params.set("skip", skip.toString());
      params.set("limit", pageSize.toString());
      if (search) params.set("search", search);

      if (extraParams) {
        Object.entries(extraParams).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
      }

      const separator = url.includes("?") ? "&" : "?";
      const response = await axiosInstance.get(
        `${url}${separator}${params.toString()}`
      );

      if (fetchId === fetchIdRef.current) {
        setItems(response.data.items || []);
        setTotalItems(response.data.total || 0);
      }
    } catch {
      if (fetchId === fetchIdRef.current) {
        setItems([]);
        setTotalItems(0);
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [url, currentPage, pageSize, search, extraParams]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  return {
    items,
    loading,
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    search,
    setSearch,
    setCurrentPage,
    refetch: fetchData,
  };
}
