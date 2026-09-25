"use client";

import { useState } from "react";
import { professionsHooks, type HisProfession } from "@/api/hisCatalogApi";
import { CatalogSyncButton } from "../_components/CatalogSyncButton";
import type { SyncReviewColumn } from "../_components/SyncReviewModal";
import { TablePagination } from "@/components/ui/TablePagination";

const SYNC_COLUMNS: SyncReviewColumn<HisProfession>[] = [
  { key: "profession_name", label: "Tên nghề nghiệp" },
];

const PAGE_SIZE = 10;

export default function ProfessionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const { data, isLoading, isError, error } = professionsHooks.useList({ currentPage, pageSize });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <CatalogSyncButton hooks={professionsHooks} columns={SYNC_COLUMNS} />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tên nghề nghiệp</th>
              <th className="px-4 py-3">Đồng bộ gần nhất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-red-500">
                  {error?.message || "Không thể tải dữ liệu"}
                </td>
              </tr>
            ) : !data?.rows.length ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Chưa có dữ liệu. Bấm &quot;Đồng bộ từ HIS&quot; để lấy dữ liệu ban đầu.
                </td>
              </tr>
            ) : (
              data.rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.profession_id}</td>
                  <td className="px-4 py-3 text-gray-900">{row.profession_name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {row.synced_at ? new Date(row.synced_at).toLocaleString("vi-VN") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={data?.count ?? 0}
          totalPages={data?.totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
