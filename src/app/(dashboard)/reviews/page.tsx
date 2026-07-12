"use client";

import { FileBarChart } from "lucide-react";
import { useReviewsList } from "./hooks/useReviewsList";
import { ReviewStatsCards } from "./_components/ReviewStatsCards";
import { ReviewFilters } from "./_components/ReviewFilters";
import { ReviewTable } from "./_components/ReviewTable";

export default function ReviewsPage() {
  const reviews = useReviewsList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Đánh giá</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý đánh giá lịch khám, phản hồi bệnh nhân và kiểm duyệt hiển thị.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary">
            <FileBarChart className="h-4 w-4" /> Báo cáo đánh giá
          </button>
        </div>
      </div>

      <ReviewStatsCards totalItems={reviews.totalItems} stats={reviews.stats} />

      <ReviewFilters
        search={reviews.search}
        onSearchChange={reviews.setSearch}
        ratingFilter={reviews.ratingFilter}
        onRatingFilterChange={(value) => {
          reviews.setRatingFilter(value);
          reviews.setPage(1);
        }}
        statusFilter={reviews.statusFilter}
        onStatusFilterChange={(value) => {
          reviews.setStatusFilter(value);
          reviews.setPage(1);
        }}
        doctorFilter={reviews.doctorFilter}
        onDoctorFilterChange={(value) => {
          reviews.setDoctorFilter(value);
          reviews.setPage(1);
        }}
        areaFilter={reviews.areaFilter}
        onAreaFilterChange={(value) => {
          reviews.setAreaFilter(value);
          reviews.setPage(1);
        }}
        fromDate={reviews.fromDate}
        onFromDateChange={reviews.setFromDate}
        toDate={reviews.toDate}
        onToDateChange={reviews.setToDate}
        doctorList={reviews.doctorList}
        examAreas={reviews.examAreas}
        onReset={reviews.resetFilters}
      />

      <ReviewTable
        rows={reviews.rows}
        isLoading={reviews.isLoading}
        page={reviews.page}
        totalPages={reviews.totalPages}
        totalItems={reviews.totalItems}
        onPageChange={reviews.setPage}
      />
    </div>
  );
}
