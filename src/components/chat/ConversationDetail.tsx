"use client";

import { useRef, useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import {
  useConversation,
  useMessages,
  useConversationLogs,
  useSendMessage,
  useAssignConversation,
  useUpdateConversationStatus,
  useAddInternalNote,
} from "@/api/chatApi";
import { useUsersList } from "@/api/userApi";
import { useToastStore } from "@/store/toastStore";
import { cn } from "@/lib/utils";
import type { ConversationStatus, MessageType } from "@/types/chat";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  Send,
  Paperclip,
  CheckCheck,
  RefreshCcw,
  UserPlus,
  StickyNote,
  Activity,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  MessageSquare,
  Smartphone,
  X,
} from "lucide-react";

// ─── Inline Skeleton ────────────────────────────────────────────────────────────

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

// ─── Status Config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ConversationStatus,
  { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "accent" }
> = {
  new: { label: "Mới", variant: "info" },
  in_progress: { label: "Đang xử lý", variant: "warning" },
  closed: { label: "Đã đóng", variant: "default" },
};

// ─── Status Dropdown Options ───────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "new", label: "Mới" },
  { value: "in_progress", label: "Đang xử lý" },
  { value: "closed", label: "Đã đóng" },
];

// ─── Log Icon ────────────────────────────────────────────────────────────────

function LogIcon({ action }: { action: string }) {
  const map: Record<string, React.ReactNode> = {
    created: <Activity className="size-3 text-muted-foreground" />,
    assigned: <UserPlus className="size-3 text-blue-600" />,
    reassigned: <RefreshCcw className="size-3 text-purple-600" />,
    status_changed: <RefreshCcw className="size-3 text-amber-600" />,
    replied: <Send className="size-3 text-green-600" />,
    note_added: <StickyNote className="size-3 text-orange-600" />,
  };
  return map[action] ?? <Activity className="size-3 text-muted-foreground" />;
}

// ─── Time Formatter ────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTimeShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Quick Replies ─────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  "Dạ vâng, em đã ghi nhận và sẽ phản hồi trong giây lát ạ.",
  "Dạ, để em kiểm tra và phản hồi lại anh/chị trong ít phút.",
  "Cảm ơn anh/chị đã phản hồi. Em sẽ chuyển thông tin tới bộ phận liên quan.",
  "Dạ, thông tin của anh/chị đã được ghi nhận. Em liên hệ lại trong 15 phút ạ.",
  "Xin lỗi vì sự bất tiện này. Em sẽ báo cáo để xử lý sớm nhất ạ.",
];

function QuickReplyPicker({ onSelect }: { onSelect: (text: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
          open
            ? "bg-primary-50 border-primary-200 text-primary-700"
            : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <MessageSquare className="size-3.5" />
        <span>Quick Replies</span>
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 z-20 w-80 bg-white rounded-xl border border-border shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-foreground">Chọn mẫu trả lời nhanh</p>
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {QUICK_REPLIES.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect(reply);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted/60 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Quick Action Bar ─────────────────────────────────────────────────────────

interface QuickActionBarProps {
  conversationId: string;
  onQuickReply: (text: string) => void;
}

function QuickActionBar({ onQuickReply }: QuickActionBarProps) {
  const [showAttach, setShowAttach] = useState(false);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-muted/20">
      <QuickReplyPicker onSelect={onQuickReply} />

      <button
        type="button"
        onClick={() => setShowAttach((s) => !s)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 border border-transparent hover:border-border"
        title="Đính kèm"
      >
        <Paperclip className="size-3.5" />
        <span>Đính kèm</span>
      </button>

      <div className="h-4 w-px bg-border mx-1" />

      <button
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 border border-transparent hover:border-border"
        title="Ghi chú nội bộ"
      >
        <StickyNote className="size-3.5" />
        <span>Ghi chú nội bộ</span>
      </button>

      {showAttach && (
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>Chức năng đính kèm đang phát triển</span>
          <button onClick={() => setShowAttach(false)}>
            <X className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: {
    id: string;
    sender_type: MessageType;
    content: string;
    attachment_type?: string | null;
    attachment_url?: string | null;
    attachment_name?: string | null;
    created_at: string;
    sender?: { full_name?: string | null; avatar?: string | null };
  };
  isNote?: boolean;
  noteActor?: { full_name?: string | null };
  noteTime?: string;
}

function MessageBubble({ message, isNote, noteActor, noteTime }: MessageBubbleProps) {
  const isUser = message.sender_type === "user";
  const isSystem = message.sender_type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs text-muted-foreground">
          <Activity className="size-3" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  // Internal note — highlighted yellow box
  if (isNote) {
    return (
      <div className="flex gap-2.5 my-3 mx-4">
        <Avatar
          name={noteActor?.full_name ?? "CSKH"}
          src={message.sender?.avatar}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-medium text-orange-700 flex items-center gap-1">
              <MessageSquare className="size-3" />
              Nội bộ
            </span>
            <span className="text-[10px] text-muted-foreground">
              {noteActor?.full_name ?? "CSKH"} · {noteTime}
            </span>
          </div>
          <div className="rounded-xl rounded-tl-sm border border-orange-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed">
            <p className="whitespace-pre-wrap break-words text-amber-900">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar
        name={message.sender?.full_name ?? (isUser ? "Người dùng" : "CSKH")}
        src={message.sender?.avatar}
        size="sm"
      />
      <div
        className={cn(
          "max-w-[75%] flex flex-col gap-0.5",
          isUser ? "items-end" : "items-start"
        )}
      >
        <span className="text-[11px] text-muted-foreground px-1">
          {message.sender?.full_name ?? (isUser ? "Người dùng" : "CSKH")}
        </span>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed",
            isUser
              ? "bg-primary-600 text-white rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {message.attachment_url && (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 mt-1 px-3 py-2 rounded-xl border text-xs",
              isUser
                ? "bg-primary-700 border-primary-500 text-white/90 hover:bg-primary-600"
                : "bg-muted/80 border-border hover:bg-muted"
            )}
          >
            {message.attachment_type === "image" ? (
              <ImageIcon className="size-4 shrink-0" />
            ) : (
              <FileText className="size-4 shrink-0" />
            )}
            <span className="truncate">
              {message.attachment_name || "Tệp đính kèm"}
            </span>
          </a>
        )}

        <span className="text-[10px] text-muted-foreground/70 px-1">
          {formatTimeShort(message.created_at)}
        </span>
      </div>
    </div>
  );
}

// ─── Reply Box ────────────────────────────────────────────────────────────────

interface ReplyBoxProps {
  conversationId: string;
  externalText?: string;
  onExternalTextConsumed?: () => void;
}

function ReplyBox({ conversationId, externalText, onExternalTextConsumed }: ReplyBoxProps) {
  const [text, setText] = useState("");
  const sendMessage = useSendMessage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Accept text from Quick Reply
  useEffect(() => {
    if (externalText) {
      setText((prev) => (prev ? `${prev}\n${externalText}` : externalText));
      onExternalTextConsumed?.();
      textareaRef.current?.focus();
    }
  }, [externalText, onExternalTextConsumed]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate(
      { conversationId, payload: { content: text.trim() } },
      {
        onSuccess: () => {
          setText("");
          textareaRef.current?.focus();
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
          title="Đính kèm tệp"
        >
          <Paperclip className="size-4" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn trả lời... (Enter để gửi, Shift+Enter để xuống dòng)"
            className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-2 pr-12 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] max-h-32 overflow-y-auto"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
        </div>

        <Button
          size="icon"
          disabled={!text.trim() || sendMessage.isPending}
          onClick={handleSend}
          className="size-9 shrink-0 rounded-full"
        >
          {sendMessage.isPending ? (
            <Spinner className="size-4" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Internal Notes ────────────────────────────────────────────────────────────

interface NoteItem {
  id: string;
  content: string;
  created_at: string;
  actor?: { full_name?: string | null; avatar?: string | null };
}

function InternalNotesTab({ conversationId }: { conversationId: string }) {
  const [noteText, setNoteText] = useState("");
  const addNote = useAddInternalNote();
  const toast = useToastStore();
  const { data: logs } = useConversationLogs(conversationId);

  const notes: NoteItem[] = (logs ?? [])
    .filter((l) => l.action === "note_added")
    .map((l) => ({
      id: l.id,
      content: l.description,
      created_at: l.created_at,
      actor: l.actor,
    }));

  const handleAdd = () => {
    if (!noteText.trim()) return;
    addNote.mutate(
      { conversationId, content: noteText.trim() },
      {
        onSuccess: () => {
          setNoteText("");
          toast.success("Đã thêm ghi chú nội bộ");
        },
        onError: (err) => toast.error("Lỗi", err.message),
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            Chưa có ghi chú nội bộ nào
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex gap-2.5 py-2.5 border-b border-border/50 last:border-0"
            >
              <Avatar
                name={note.actor?.full_name ?? "CSKH"}
                src={note.actor?.avatar}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium">
                    {note.actor?.full_name ?? "CSKH"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(note.created_at)}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 whitespace-pre-wrap break-words">
                  {note.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Ghi chú nội bộ (chỉ CSKH nhìn thấy)..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <Button
            size="sm"
            disabled={!noteText.trim() || addNote.isPending}
            onClick={handleAdd}
            className="shrink-0"
          >
            {addNote.isPending ? <Spinner className="size-3" /> : "Thêm"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Logs Tab ────────────────────────────────────────────────────────────────

function LogsTab({ conversationId }: { conversationId: string }) {
  const { data: logs, isLoading } = useConversationLogs(conversationId);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-6 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-2.5 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Chưa có lịch sử thao tác
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-3 px-4 py-2.5 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
        >
          <div className="shrink-0 mt-0.5">
            <LogIcon action={log.action} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground/80">{log.description}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {log.actor?.full_name ?? "Hệ thống"} · {formatTime(log.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Detail Header ───────────────────────────────────────────────────────────

interface DetailHeaderProps {
  conversation: {
    id: string;
    user?: { full_name?: string | null; phone?: string | null; avatar?: string | null };
    patient?: { full_name?: string | null; phone?: string | null };
    patient_id?: string | null;
    assigned_to?: { full_name?: string | null; avatar?: string | null } | null;
    assigned_to_id?: string | null;
    status: ConversationStatus;
    title?: string;
  } | null;
  isLoading: boolean;
  onStatusChange: (status: ConversationStatus) => void;
  onAssign: (userId: string) => void;
}

function DetailHeader({ conversation, isLoading, onStatusChange, onAssign }: DetailHeaderProps) {
  // Danh sách người có thể được gán hội thoại.
  //
  // TODO(RBAC): bộ lọc này không còn đúng sau khi `is_admin` được thu hẹp nghĩa
  // thành "super admin duy nhất". Nhân viên nội bộ tạo mới qua
  // `POST /internal-accounts` có `is_admin: false`, nên danh sách này sẽ chỉ
  // còn super admin (cộng các nhân viên cũ vẫn giữ `is_admin = true` vì không
  // có migration). Đã kiểm tra và KHÔNG có chuỗi `filters` nào trên
  // `GET /users` diễn tả được "user có vai trò nội bộ":
  //   - bảng `user` không có cột nào mang nghĩa đó;
  //   - `sequelize-api-paginate` dịch tên có dấu chấm thành `$assoc.col$`,
  //     nhưng `getAllUsers` ở backend không truyền `include` nên
  //     `$user_roles.role_id$` không resolve được;
  //   - `GET /users` hiện là `[verify, verifyAdmin, ...]` → non-super-admin bị
  //     403 bất kể filter.
  // Cách đúng cần backend hỗ trợ: hoặc cho `GET /users` nhận filter theo vai
  // trò (kèm `include`), hoặc dùng `GET /user-roles` làm nguồn danh sách nhân
  // viên — nhưng endpoint đó cũng đang bị `verifyAdmin` chặn và chỉ trả về
  // user đã được gán vai trò. Giữ nguyên filter cũ cho tới khi backend đổi.
  const { data: users } = useUsersList({
    pageSize: 200,
    filters: "is_admin==true,is_active==true",
  });
  const statusConfig = conversation ? STATUS_CONFIG[conversation.status] : null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white shrink-0">
      {isLoading ? (
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            name={conversation?.user?.full_name ?? "Người dùng"}
            src={conversation?.user?.avatar}
            size="sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate">
                {conversation?.user?.full_name ?? "Người dùng"}
              </p>
              {conversation?.user?.phone && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Smartphone className="size-3" />
                  {conversation.user.phone}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {statusConfig && (
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
              )}
              {conversation?.patient_id && (
                <Badge variant="accent">Bệnh nhân HIS</Badge>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {/* Status dropdown */}
        <Select
          value={conversation?.status ?? "new"}
          onChange={(e) => {
            const val = e.target.value as ConversationStatus;
            if (val !== conversation?.status) onStatusChange(val);
          }}
          options={STATUS_OPTIONS}
          className="h-8 text-xs min-w-[130px]"
        />

        {/* Assign */}
        <Select
          value={conversation?.assigned_to_id ?? ""}
          onChange={(e) => e.target.value && onAssign(e.target.value)}
          placeholder="Gán cho..."
          options={[
            { value: "", label: "Chưa gán" },
            ...(users?.rows ?? []).map((u) => ({
              value: u.id,
              label: u.full_name ?? u.id,
            })),
          ]}
          className="h-8 text-xs min-w-[130px]"
        />

        {conversation && conversation.status !== "closed" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange("closed")}
            className="h-8 text-xs gap-1"
          >
            <CheckCheck className="size-3.5" />
            Đóng
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange("in_progress")}
            className="h-8 text-xs gap-1"
          >
            <RefreshCcw className="size-3.5" />
            Mở lại
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────

interface MessagesTabProps {
  conversationId: string;
  quickReplyText: string;
  onQuickReplyConsumed: () => void;
}

function MessagesTab({ conversationId, quickReplyText, onQuickReplyConsumed }: MessagesTabProps) {
  const { data: messages, isLoading } = useMessages(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner />
          </div>
        ) : (!messages || messages.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Send className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Chưa có tin nhắn nào</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tin nhắn của người dùng sẽ xuất hiện ở đây
            </p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <ReplyBox
        conversationId={conversationId}
        externalText={quickReplyText}
        onExternalTextConsumed={onQuickReplyConsumed}
      />
    </div>
  );
}

// ─── Conversation Detail (main export) ────────────────────────────────────────

export function ConversationDetail() {
  const { selectedConversationId, activeDetailTab, setActiveDetailTab } = useChatStore();
  const { data: conversation, isLoading } = useConversation(selectedConversationId);
  const updateStatus = useUpdateConversationStatus();
  const assign = useAssignConversation();
  const toast = useToastStore();

  const [quickReplyText, setQuickReplyText] = useState<string | undefined>();

  const handleStatusChange = (status: ConversationStatus) => {
    if (!selectedConversationId) return;
    updateStatus.mutate(
      { conversationId: selectedConversationId, payload: { status } },
      {
        onSuccess: () => toast.success(STATUS_CONFIG[status].label + " cuộc chat"),
        onError: (err) => toast.error("Lỗi", err.message),
      }
    );
  };

  const handleAssign = (userId: string) => {
    if (!selectedConversationId) return;
    assign.mutate(
      { conversationId: selectedConversationId, payload: { assigned_to_id: userId } },
      {
        onSuccess: () => toast.success("Đã gán cuộc hội thoại"),
        onError: (err) => toast.error("Lỗi", err.message),
      }
    );
  };

  if (!selectedConversationId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/10">
        <div className="text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="size-7 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">
            Chọn một cuộc hội thoại
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Chọn cuộc hội thoại từ danh sách bên trái để xem chi tiết
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <DetailHeader
        conversation={conversation ?? null}
        isLoading={isLoading}
        onStatusChange={handleStatusChange}
        onAssign={handleAssign}
      />

      {/* Quick action bar */}
      {activeDetailTab === "messages" && (
        <QuickActionBar
          conversationId={selectedConversationId}
          onQuickReply={(text) => setQuickReplyText(text)}
        />
      )}

      {/* Tabs */}
      <div className="shrink-0 border-b border-border">
        <Tabs
          activeKey={activeDetailTab}
          onChange={(key) => setActiveDetailTab(key as "messages" | "notes" | "logs")}
          tabs={[
            { key: "messages", label: "Tin nhắn" },
            { key: "notes", label: "Ghi chú nội bộ" },
            { key: "logs", label: "Lịch sử" },
          ]}
          className="px-4"
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeDetailTab === "messages" && (
          <MessagesTab
            conversationId={selectedConversationId}
            quickReplyText={quickReplyText ?? ""}
            onQuickReplyConsumed={() => setQuickReplyText(undefined)}
          />
        )}
        {activeDetailTab === "notes" && (
          <InternalNotesTab conversationId={selectedConversationId} />
        )}
        {activeDetailTab === "logs" && (
          <div className="flex-1 overflow-y-auto">
            <LogsTab conversationId={selectedConversationId} />
          </div>
        )}
      </div>
    </div>
  );
}
