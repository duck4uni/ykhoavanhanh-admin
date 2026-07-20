"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface TablePaginationProps {
  currentPage: number;
  pageSize?: number;
  totalCount?: number;
  /** Alias for totalCount */
  totalItems?: number;
  /** Override computed totalPages */
  totalPages?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function TablePagination({
  currentPage,
  pageSize = 10,
  totalCount,
  totalItems,
  totalPages: totalPagesProp,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const resolvedTotal = totalCount ?? totalItems ?? 0;
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) setIsPageSizeOpen(false);
    };
    if (isPageSizeOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isPageSizeOpen]);

  const totalPages = totalPagesProp ?? Math.max(1, Math.ceil(resolvedTotal / pageSize));
  const from = resolvedTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, resolvedTotal);

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    const add = (p: number) => { if (!pages.includes(p)) pages.push(p); };
    add(1);
    if (currentPage > 3) pages.push("...");
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) add(p);
    if (currentPage < totalPages - 2) pages.push("...");
    add(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
      <span className="text-sm text-gray-600">
        {resolvedTotal === 0 ? "Không có kết quả" : `Hiển thị ${from}–${to} trong ${resolvedTotal} kết quả`}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <span>Hiển thị</span>
          <div ref={pageSizeRef} className="relative">
            <button
              onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
              className="h-8 px-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1 font-medium"
            >
              {pageSize}
              <ChevronLeft className="w-3 h-3 rotate-90" />
            </button>
            {isPageSizeOpen && (
              <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    onClick={() => { onPageSizeChange?.(size); setIsPageSizeOpen(false); }}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-primary-50 whitespace-nowrap ${size === pageSize ? "bg-primary-100 text-primary-700 font-semibold" : "text-gray-700"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className="h-8 w-8 flex items-center justify-center text-sm text-gray-500">…</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`h-8 w-8 flex items-center justify-center rounded text-sm font-medium border transition-colors ${page === currentPage ? "bg-primary-600 text-white border-primary-600" : "border-gray-300 hover:bg-gray-50 text-gray-700"}`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
