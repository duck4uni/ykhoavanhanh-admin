import { createApi } from "./createApi";

// ─── Types (theo endpoint /page-config) ──────────────────────────────────

export interface PageConfig {
  id: string;
  name: string;
  code: string;
  /** Nội dung cấu hình — dùng lưu URL ảnh / link banner. */
  content: string | null;
  created_at: string | null;
  created_by?: string | null;
  updated_at: string | null;
  updated_by?: string | null;
  deleted_at: string | null;
}

export interface CreatePageConfigPayload {
  name: string;
  code: string;
  content?: string;
}

export interface UpdatePageConfigPayload extends Partial<CreatePageConfigPayload> {
  updated_by?: string;
}

// ─── API Factory ──────────────────────────────────────────────────────────

export const pageConfigApi = createApi<PageConfig>("page-config");

export const pageConfigService = pageConfigApi.service;
export const pageConfigKeys = pageConfigApi.keys;
export const pageConfigHooks = pageConfigApi.hooks;
