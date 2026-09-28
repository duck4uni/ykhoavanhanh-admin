/**
 * Chính sách sử dụng — Resource: /api/v1.0/policies
 * GET (list, detail) là public; POST/PATCH/DELETE yêu cầu admin.
 * Soft-delete: backend set `deleted_at`, không có Sequelize paranoid — chỉ lọc thủ công.
 */
import { createApi } from "./createApi";

export interface AdminPolicy {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null;
}

export const {
  service: policiesService,
  keys: policiesKeys,
  hooks: policiesHooks,
} = createApi<AdminPolicy>("policies");
