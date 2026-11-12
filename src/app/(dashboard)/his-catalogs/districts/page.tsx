"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { TablePagination } from "@/components/ui/TablePagination";
import { districtsHooks, provincesHooks, type HisDistrict } from "@/api/hisCatalogApi";
import { CatalogSyncButton } from "../_components/CatalogSyncButton";
import type { SyncReviewColumn } from "../_components/SyncReviewModal";

const SYNC_COLUMNS: SyncReviewColumn<HisDistrict>[] = [
  { key: "district_name", label: "Tên quận/huyện" },
  { key: "district_type", label: "Loại" },
  { key: "province_code", label: "Mã tỉnh/thành" },
];

const PAGE_SIZE = 10;

export default function DistrictsPage() {
  const [provinceCode, setProvinceCode] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const {
    data: provincesData,
    isLoading: isLoadingProvinces,
    isError: isProvincesError,
    error: provincesError,
  } = provincesHooks.useList({ pageSize: 1000 });
  const provinceOptions = useMemo(
    () =>
      (provincesData?.rows ?? []).map((p) => ({ value: p.province_code, label: p.province_name })),
    [provincesData]
  );
  const provincesEmpty =
    !isLoadingProvinces && !isProvincesError && provinceOptions.length === 0;

  const { data, isLoading, isError, error } = districtsHooks.useList(
    { city: provinceCode, currentPage, pageSize },
    { enabled: !!provinceCode }
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-xs">
          <Select
            label="Tỉnh/Thành"
            placeholder={isLoadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành"}
            options={provinceOptions}
            value={provinceCode}
            disabled={isLoadingProvinces || provinceOptions.length === 0}
            onValueChange={(value) => {
              setProvinceCode(value);
              setCurrentPage(1);
            }}
          />
          {isProvincesError && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3.5 w-3.5" />
              {provincesError?.message || "Không thể tải danh sách tỉnh/thành"}
            </p>
          )}
          {provincesEmpty && (
            <p className="mt-1 text-xs text-gray-500">
              Chưa có dữ liệu tỉnh/thành. Vào tab{" "}
              <Link href="/his-catalogs/provinces" className="text-primary-600 underline">
                Tỉnh/Thành
              </Link>{" "}
              và bấm &quot;Đồng bộ từ HIS&quot; trước.
            </p>
          )}
        </div>
        <CatalogSyncButton
          hooks={districtsHooks}
          syncParams={{ city: provinceCode }}
          columns={SYNC_COLUMNS}
          disabled={!provinceCode}
          disabledReason="Chọn tỉnh/thành trước khi đồng bộ"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tên quận/huyện</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Đồng bộ gần nhất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!provinceCode ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Chọn tỉnh/thành để xem danh sách quận/huyện.
                </td>
              </tr>
            ) : isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-red-500">
                  {error?.message || "Không thể tải dữ liệu"}
                </td>
              </tr>
            ) : !data?.rows.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Chưa có dữ liệu. Bấm &quot;Đồng bộ từ HIS&quot; để lấy dữ liệu ban đầu.
                </td>
              </tr>
            ) : (
              data.rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.district_code}</td>
                  <td className="px-4 py-3 text-gray-900">{row.district_name}</td>
                  <td className="px-4 py-3 text-gray-500">{row.district_type || "—"}</td>
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
