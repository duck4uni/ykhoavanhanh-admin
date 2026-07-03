import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/axios";
import { createApi } from "./createApi";

// ─── Types (theo api.md) ────────────────────────────────────────────────

export type NotificationCategory = "APPOINTMENT" | "SYSTEM";

export type NotificationSubCategory = "CONFIRMED" | "CANCELLED" | "REMINDER" | "SYSTEM";

export interface Notification {
  id: string;
  title: string;
  content: string;
  category: NotificationCategory;
  sub_category?: NotificationSubCategory;
  belongs_to_user_id: string;
  has_user_read: boolean;
  sent_time: string;
  has_noti_sent: boolean;
  expired_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedNotifications {
  count: number;
  rows: Notification[];
  totalPages: number;
  currentPage: number;
}

export interface NotificationQuery {
  currentPage?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
  filters?: string;
}

// ─── CRUD Factory ────────────────────────────────────────────────────────

const { service: baseService, hooks: baseHooks, keys } = createApi<Notification>("notifications");

// ─── Custom service ───────────────────────────────────────────────────────

export const notificationsService = {
  ...baseService,

  create: async (data: Partial<Notification>): Promise<Notification> => {
    const res = await apiPost<Notification[]>("/notifications", [data as Record<string, unknown>]);
    if (res.data.status === "success" && res.data.responseData && res.data.responseData.length > 0) {
      return res.data.responseData[0];
    }
    throw new Error(res.data.message || "Tạo thông báo thất bại");
  },

  getList: async (params?: NotificationQuery): Promise<PaginatedNotifications> => {
    const res = await apiGet<PaginatedNotifications>("/notifications", { params });
    if (res.data.status === "success" && res.data.responseData) {
      return res.data.responseData;
    }
    throw new Error(res.data.message || "Không thể lấy danh sách thông báo");
  },

  markAsReadAll: async (filters?: string): Promise<number> => {
    const url = filters
      ? `/notifications/markAsRead?filters=${filters}`
      : "/notifications/markAsRead";
    const res = await apiPut<number[]>(url);
    if (res.data.status === "success" && res.data.responseData) {
      return res.data.responseData[0] ?? 0;
    }
    throw new Error(res.data.message || "Đánh dấu đã đọc thất bại");
  },

  markAsReadById: async (id: string): Promise<Notification> => {
    const res = await apiGet<Notification>(`/notifications/markAsRead/${id}`);
    if (res.data.status === "success" && res.data.responseData) {
      return res.data.responseData;
    }
    throw new Error(res.data.message || "Đánh dấu đã đọc thất bại");
  },
};

// ─── Query Keys ─────────────────────────────────────────────────────────

export const notificationsKeys = keys;

// ─── Hooks ────────────────────────────────────────────────────────────────

export const notificationsHooks = {
  ...baseHooks,

  useCreate: (
    options?: UseMutationOptions<Notification, Error, Partial<Notification>>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<Notification, Error, Partial<Notification>>({
      mutationFn: (data) => notificationsService.create(data),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: notificationsKeys.all });
        (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
      },
      ...rest,
    });
  },

  useList: (
    params?: NotificationQuery,
    options?: { enabled?: boolean; staleTime?: number }
  ): UseQueryResult<PaginatedNotifications, Error> => {
    return useQuery<PaginatedNotifications, Error>({
      queryKey: notificationsKeys.list(params),
      queryFn: () => notificationsService.getList(params),
      staleTime: 1000 * 60 * 1,
      enabled: options?.enabled ?? true,
      ...options,
    });
  },

  useMarkAsReadAll: (
    options?: UseMutationOptions<number, Error, string | undefined>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<number, Error, string | undefined>({
      mutationFn: (filters) => notificationsService.markAsReadAll(filters),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: notificationsKeys.all });
        (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
      },
      ...rest,
    });
  },

  useMarkAsReadById: (
    options?: UseMutationOptions<Notification, Error, string>
  ) => {
    const qc = useQueryClient();
    const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options ?? {};
    return useMutation<Notification, Error, string>({
      mutationFn: (id) => notificationsService.markAsReadById(id),
      onSuccess: (data, variables, context) => {
        qc.invalidateQueries({ queryKey: notificationsKeys.all });
        qc.invalidateQueries({ queryKey: notificationsKeys.detail(variables) });
        (userOnSuccess as unknown as undefined | ((d: typeof data, v: typeof variables, c: typeof context) => unknown))?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        (userOnError as unknown as undefined | ((e: typeof error, v: typeof variables, c: typeof context) => unknown))?.(error, variables, context);
      },
      ...rest,
    });
  },
};
