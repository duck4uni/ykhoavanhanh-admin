

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/axios";
import type {
  Conversation,
  Message,
  ConversationLog,
  ConversationListParams,
  ConversationListResponse,
  SendMessagePayload,
  AssignConversationPayload,
  UpdateStatusPayload,
} from "@/types/chat";
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_LOGS,
} from "@/lib/mock-chat";

// ─── Query Keys ─────────────────────────────────────────────────────────────────

const conversationBase = ["chats", "conversations"] as const;

export const conversationKeys = {
  all: conversationBase,
  list: (params?: ConversationListParams) =>
    [...conversationBase, "list", params] as const,
  detail: (id: string) =>
    [...conversationBase, "detail", id] as const,
  messages: (conversationId: string) =>
    [...conversationBase, conversationId, "messages"] as const,
  logs: (conversationId: string) =>
    [...conversationBase, conversationId, "logs"] as const,
  notes: (conversationId: string) =>
    [...conversationBase, conversationId, "notes"] as const,
};

// ─── Mock Flag ────────────────────────────────────────────────────────────────

/** Set false when backend has real API */
const IS_MOCK = false;

// ─── Delay helper (simulate network) ─────────────────────────────────────────

const delay = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface BackendConversationPage {
  count: number;
  rows: Conversation[];
  totalPages: number;
  currentPage: number;
}

// ─── Service Functions ────────────────────────────────────────────────────────

async function fetchConversations(
  params?: ConversationListParams
): Promise<ConversationListResponse> {
  if (IS_MOCK) {
    await delay();
    let items = [...MOCK_CONVERSATIONS];

    if (params?.status) {
      items = items.filter((c) => c.status === params.status);
    }
    if (params?.assigned_to_id) {
      items = items.filter(
        (c) => c.assigned_to_id === params.assigned_to_id
      );
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (c) =>
          c.user?.full_name?.toLowerCase().includes(q) ||
          c.user?.phone?.includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.last_message?.toLowerCase().includes(q)
      );
    }

    return {
      items,
      total: items.length,
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 20,
    };
  }

  // Backend dùng currentPage/pageSize và trả { count, rows, totalPages, currentPage }.
  const res = await apiGet<BackendConversationPage>("/chats/conversations", {
    params: {
      status: params?.status,
      assigned_to_id: params?.assigned_to_id,
      search: params?.search,
      currentPage: params?.page,
      pageSize: params?.per_page,
    },
  });
  if (res.data.status === "success" && res.data.responseData) {
    const page = res.data.responseData;
    return {
      items: page.rows,
      total: page.count,
      page: page.currentPage,
      per_page: params?.per_page ?? 20,
    };
  }
  throw new Error(
    res.data.message || "Không thể lấy danh sách cuộc hội thoại"
  );
}

async function fetchConversationById(id: string): Promise<Conversation> {
  if (IS_MOCK) {
    await delay();
    const conv = MOCK_CONVERSATIONS.find((c) => c.id === id);
    if (!conv) throw new Error("Không tìm thấy cuộc hội thoại");
    return conv;
  }

  const res = await apiGet<Conversation>(`/chats/conversations/${id}`);
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Không thể lấy cuộc hội thoại");
}

async function fetchMessages(conversationId: string): Promise<Message[]> {
  if (IS_MOCK) {
    await delay();
    return MOCK_MESSAGES[conversationId] ?? [];
  }

  const res = await apiGet<Message[]>(
    `/chats/conversations/${conversationId}/messages`
  );
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Không thể lấy tin nhắn");
}

async function fetchConversationLogs(
  conversationId: string
): Promise<ConversationLog[]> {
  if (IS_MOCK) {
    await delay();
    return MOCK_LOGS[conversationId] ?? [];
  }

  const res = await apiGet<ConversationLog[]>(
    `/chats/conversations/${conversationId}/logs`
  );
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Không thể lấy lịch sử");
}

async function sendMessage(
  conversationId: string,
  payload: SendMessagePayload
): Promise<Message> {
  if (IS_MOCK) {
    await delay(600);
    const newMsg: Message = {
      id: `msg-mock-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: "current-staff-id",
      sender_type: "staff",
      content: payload.content,
      attachment_url: payload.attachment_url,
      attachment_type: payload.attachment_type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (!MOCK_MESSAGES[conversationId]) {
      MOCK_MESSAGES[conversationId] = [];
    }
    MOCK_MESSAGES[conversationId].push(newMsg);
    return newMsg;
  }

  const res = await apiPost<Message>(
    `/chats/conversations/${conversationId}/messages`,
    payload
  );
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Gửi tin nhắn thất bại");
}

async function assignConversation(
  conversationId: string,
  payload: AssignConversationPayload
): Promise<Conversation> {
  if (IS_MOCK) {
    await delay(400);
    const idx = MOCK_CONVERSATIONS.findIndex((c) => c.id === conversationId);
    if (idx === -1) throw new Error("Không tìm thấy cuộc hội thoại");

    const staffMap: Record<string, typeof MOCK_CONVERSATIONS[0]["assigned_to"]> = {
      "staff-huyen": {
        id: "staff-huyen",
        name: "Nguyễn Thị Minh Huyền",
        full_name: "Nguyễn Thị Minh Huyền",
        phone: "0901234567",
        avatar: "https://i.pravatar.cc/150?img=47",
      },
      "staff-anh": {
        id: "staff-anh",
        name: "Trần Văn Anh",
        full_name: "Trần Văn Anh",
        phone: "0912345678",
        avatar: "https://i.pravatar.cc/150?img=68",
      },
      "staff-khanh": {
        id: "staff-khanh",
        name: "Lê Thị Khánh",
        full_name: "Lê Thị Khánh",
        phone: "0923456789",
        avatar: "https://i.pravatar.cc/150?img=49",
      },
    };

    const updated = {
      ...MOCK_CONVERSATIONS[idx],
      assigned_to_id: payload.assigned_to_id,
      assigned_to: staffMap[payload.assigned_to_id] ?? null,
      updated_at: new Date().toISOString(),
    };
    MOCK_CONVERSATIONS[idx] = updated;
    return updated;
  }

  const res = await apiPut<Conversation>(
    `/chats/conversations/${conversationId}/assign`,
    payload
  );
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Gán cuộc hội thoại thất bại");
}

async function updateConversationStatus(
  conversationId: string,
  payload: UpdateStatusPayload
): Promise<Conversation> {
  if (IS_MOCK) {
    await delay(400);
    const idx = MOCK_CONVERSATIONS.findIndex((c) => c.id === conversationId);
    if (idx === -1) throw new Error("Không tìm thấy cuộc hội thoại");

    const updated = {
      ...MOCK_CONVERSATIONS[idx],
      status: payload.status,
      updated_at: new Date().toISOString(),
    };
    MOCK_CONVERSATIONS[idx] = updated;
    return updated;
  }

  const res = await apiPut<Conversation>(
    `/chats/conversations/${conversationId}/status`,
    payload
  );
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Cập nhật trạng thái thất bại");
}

async function addInternalNote(
  conversationId: string,
  content: string
): Promise<ConversationLog> {
  if (IS_MOCK) {
    await delay(500);
    const newLog: ConversationLog = {
      id: `log-mock-${Date.now()}`,
      conversation_id: conversationId,
      action: "note_added",
      actor_id: "current-staff-id",
      actor: {
        id: "current-staff-id",
        name: "Nguyễn Thị Minh Huyền",
        full_name: "Nguyễn Thị Minh Huyền",
      },
      description: content,
      created_at: new Date().toISOString(),
    };
    if (!MOCK_LOGS[conversationId]) {
      MOCK_LOGS[conversationId] = [];
    }
    MOCK_LOGS[conversationId].push(newLog);
    return newLog;
  }

  const res = await apiPost<ConversationLog>(
    `/chats/conversations/${conversationId}/notes`,
    { content }
  );
  if (res.data.status === "success" && res.data.responseData) {
    return res.data.responseData;
  }
  throw new Error(res.data.message || "Thêm ghi chú thất bại");
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useConversations(params?: ConversationListParams) {
  return useQuery({
    queryKey: conversationKeys.list(params),
    queryFn: () => fetchConversations(params),
    staleTime: 1000 * 30,
    refetchInterval: IS_MOCK ? false : 1000 * 60,
  });
}

export function useConversation(id: string | null | undefined) {
  return useQuery({
    queryKey: conversationKeys.detail(id ?? ""),
    queryFn: () => fetchConversationById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useMessages(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: conversationKeys.messages(conversationId ?? ""),
    queryFn: () => fetchMessages(conversationId!),
    enabled: Boolean(conversationId),
    staleTime: 1000 * 15,
    refetchInterval: IS_MOCK ? false : 1000 * 30,
  });
}

export function useConversationLogs(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: conversationKeys.logs(conversationId ?? ""),
    queryFn: () => fetchConversationLogs(conversationId!),
    enabled: Boolean(conversationId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSendMessage(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      payload,
    }: {
      conversationId: string;
      payload: SendMessagePayload;
    }) => sendMessage(conversationId, payload),
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: conversationKeys.messages(conversationId) });
      qc.invalidateQueries({ queryKey: conversationKeys.list(undefined) });
    },
    onError: (error) => options?.onError?.(error as Error),
    ...options,
  });
}

export function useAssignConversation(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      payload,
    }: {
      conversationId: string;
      payload: AssignConversationPayload;
    }) => assignConversation(conversationId, payload),
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: conversationKeys.list(undefined) });
      qc.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) });
      qc.invalidateQueries({ queryKey: conversationKeys.logs(conversationId) });
    },
    onError: (error) => options?.onError?.(error as Error),
    ...options,
  });
}

export function useUpdateConversationStatus(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      payload,
    }: {
      conversationId: string;
      payload: UpdateStatusPayload;
    }) => updateConversationStatus(conversationId, payload),
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: conversationKeys.list(undefined) });
      qc.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) });
      qc.invalidateQueries({ queryKey: conversationKeys.logs(conversationId) });
    },
    onError: (error) => options?.onError?.(error as Error),
    ...options,
  });
}

export function useAddInternalNote(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => addInternalNote(conversationId, content),
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: conversationKeys.logs(conversationId) });
      qc.invalidateQueries({ queryKey: conversationKeys.notes(conversationId) });
    },
    onError: (error) => options?.onError?.(error as Error),
    ...options,
  });
}
