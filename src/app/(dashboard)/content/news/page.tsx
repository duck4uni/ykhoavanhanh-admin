"use client";

import { useNewsList } from "./hooks/useNewsList";
import { NewsStatsCards } from "./_components/NewsStatsCards";
import { NewsHeaderFilters } from "./_components/NewsHeaderFilters";
import { NewsTable } from "./_components/NewsTable";
import type { NewsStatusFilter } from "./types";

export default function NewsPage() {
  const news = useNewsList();

  return (
    <div className="space-y-6">
      <NewsStatsCards stats={news.stats} />

      <NewsHeaderFilters
        activeFilterCount={news.activeFilterCount}
        search={news.search}
        onSearchChange={(value) => {
          news.setSearch(value);
          news.setPage(1);
        }}
        statusFilter={news.statusFilter}
        onStatusFilterChange={(value: NewsStatusFilter) => {
          news.setStatusFilter(value);
          news.setPage(1);
        }}
        categoryFilter={news.categoryFilter}
        onCategoryFilterChange={(value) => {
          news.setCategoryFilter(value);
          news.setPage(1);
        }}
        categoryOptions={news.categoryOptions}
        onResetFilters={news.resetFilters}
      />

      <NewsTable
        rows={news.rows}
        isFetching={news.isFetching}
        page={news.page}
        total={news.total}
        totalPages={news.totalPages}
        isDeleting={news.deleteMutation.isPending}
        onPageChange={news.setPage}
        onDelete={(id) => news.deleteMutation.mutate(id)}
      />
    </div>
  );
}
