"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { TablePagination } from "@/components/ui/TablePagination";
import { districtsHooks, provincesHooks, wardsHooks, type HisWard } from "@/api/hisCatalogApi";
import { CatalogSyncButton } from "../_components/CatalogSyncButton";
import type { SyncReviewColumn } from "../_components/SyncReviewModal";

const SYNC_COLUMNS: SyncReviewColumn<HisWard>[] = [
  { key: "ward_name", label: "Tên phường/xã" },
  { key: "ward_type", label: "Loại" },
  { key: "district_code", label: "Mã quận/huyện" },
];

const PAGE_SIZE = 10;

export default function WardsPage() {
  const [provinceCode, setProvinceCode] = useState<string>("");
  const [districtCode, setDistrictCode] = useState<string>("");
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

  const {
    data: districtsData,
    isLoading: isLoadingDistricts,
    isError: isDistrictsListError,
    error: districtsListError,
  } = districtsHooks.useList(
    { city: provinceCode, pageSize: 1000 },
    { enabled: !!provinceCode }
  );
  const districtOptions = useMemo(
    () =>
      (districtsData?.rows ?? []).map((d) => ({
        value: d.district_code,
        label: d.district_name || d.district_code,
      })),
    [districtsData]
  );
  const districtsEmpty =
    !!provinceCode && !isLoadingDistricts && !isDistrictsListError && districtOptions.length === 0;

  const { data, isLoading, isError, error } = wardsHooks.useList(
    { districtcode: districtCode, currentPage, pageSize },
    { enabled: !!districtCode }
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full max-w-lg gap-3">
          <div className="flex-1">
            <Select
              label="Tỉnh/Thành"
              placeholder={isLoadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành"}
              options={provinceOptions}
              value={provinceCode}
              disabled={isLoadingProvinces || provinceOptions.length === 0}
              onValueChange={(value) => {
                setProvinceCode(value);
                setDistrictCode("");
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
                Chưa có dữ liệu. Vào tab{" "}
                <Link href="/his-catalogs/provinces" className="text-primary-600 underline">
                  Tỉnh/Thành
                </Link>{" "}
                và đồng bộ trước.
              </p>
            )}
          </div>
          <div className="flex-1">
            <Select
              label="Quận/Huyện"
              placeholder={isLoadingDistricts ? "Đang tải..." : "Chọn quận/huyện"}
              options={districtOptions}
              value={districtCode}
              disabled={!provinceCode || isLoadingDistricts || districtOptions.length === 0}
              onValueChange={(value) => {
                setDistrictCode(value);
                setCurrentPage(1);
              }}
            />
            {isDistrictsListError && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
                {districtsListError?.message || "Không thể tải danh sách quận/huyện"}
              </p>
            )}
            {districtsEmpty && (
              <p className="mt-1 text-xs text-gray-500">
                Chưa có dữ liệu. Vào tab{" "}
                <Link href="/his-catalogs/districts" className="text-primary-600 underline">
                  Quận/Huyện
                </Link>{" "}
                và đồng bộ tỉnh này trước.
              </p>
            )}
          </div>
        </div>
        <CatalogSyncButton
          hooks={wardsHooks}
          syncParams={{ districtcode: districtCode }}
          columns={SYNC_COLUMNS}
          disabled={!districtCode}
          disabledReason="Chọn quận/huyện trước khi đồng bộ"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tên phường/xã</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Đồng bộ gần nhất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!districtCode ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Chọn tỉnh/thành và quận/huyện để xem danh sách phường/xã.
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
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.ward_code}</td>
                  <td className="px-4 py-3 text-gray-900">{row.ward_name}</td>
                  <td className="px-4 py-3 text-gray-500">{row.ward_type || "—"}</td>
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
