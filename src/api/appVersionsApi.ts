/**
 * Quản lý bản cập nhật ứng dụng — Resource: /api/v1.0/app-versions
 * - POST nhận **mảng** bản ghi (bulk create) nên `create` được ghi đè.
 * - DELETE là xóa cứng.
 * - `/app-versions/{id}/users`: user/thiết bị đang dùng đúng phiên bản (khớp platform + version_name + version_code).
 */
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { createApi, type PaginatedResult } from "./createApi";
import { apiGet, apiPost } from "@/lib/axios";
import type { PaginationParams } from "@/types/api-response";

export interface AdminAppVersion {
  id: string;
  platform: string;
  version_name: string;
  version_code: string;
  min_version: string;
  update_type: string;
  status: string;
  effective_date: string;
  update_title: string;
  update_content: string;
  cta_text: string;
  store_url: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type AppVersionPayload = Omit<AdminAppVersion, "id" | "created_at" | "updated_at">;

export interface AppVersionUser {
  id: string;
  user_id: string;
  device_id: string | null;
  device_model: string | null;
  os_version: string | null;
  platform: string;
  version_name: string;
  version_code: string;
  last_active_at: string | null;
  user: {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    avatar: string | null;
    is_active: boolean;
  } | null;
}

export interface AppVersionUsersResult extends PaginatedResult<AppVersionUser> {
  app_version: Pick<AdminAppVersion, "id" | "platform" | "version_name" | "version_code">;
}

const {
  service: baseService,
  keys: appVersionsKeys,
  hooks: baseHooks,
} = createApi<AdminAppVersion>("app-versions");

export { appVersionsKeys };

export const appVersionsService = {
  ...baseService,

  /** Backend nhận mảng ở POST → bọc 1 phần tử và lấy phần tử đầu của kết quả. */
  create: async (data: AppVersionPayload): Promise<AdminAppVersion> => {
    const res = await apiPost<AdminAppVersion[]>("/app-versions", [data]);
    if (res.data.status === "success" && res.data.responseData?.length) {
      return res.data.responseData[0];
    }
    throw new Error(res.data.message || "Tạo bản cập nhật thất bại");
  },

  getUsers: async (id: string, params?: PaginationParams): Promise<AppVersionUsersResult> => {
    const res = await apiGet<AppVersionUsersResult>(`/app-versions/${id}/users`, { params });
    if (res.data.status === "success" && res.data.responseData) {
      return res.data.responseData;
    }
    throw new Error(res.data.message || "Không thể lấy danh sách người dùng theo phiên bản");
  },
};

export const appVersionsHooks = {
  useList: baseHooks.useList,
  useDetail: baseHooks.useDetail,
  useUpdate: baseHooks.useUpdate,
  useDelete: baseHooks.useDelete,

  useCreate: (options?: { onSuccess?: (data: AdminAppVersion) => void; onError?: (error: Error) => void }) => {
    const qc = useQueryClient();
    return useMutation<AdminAppVersion, Error, AppVersionPayload>({
      mutationFn: (data) => appVersionsService.create(data),
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: appVersionsKeys.all });
        options?.onSuccess?.(data);
      },
      onError: (error) => options?.onError?.(error),
    });
  },

  useUsers: (
    id: string | null | undefined,
    params?: PaginationParams
  ): UseQueryResult<AppVersionUsersResult, Error> =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery<AppVersionUsersResult, Error>({
      queryKey: [...appVersionsKeys.detail(id ?? ""), "users", params],
      queryFn: () => appVersionsService.getUsers(id!, params),
      enabled: Boolean(id),
      staleTime: 1000 * 60,
    }),
};
