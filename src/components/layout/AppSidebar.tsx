"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  LayoutGrid,
  MessageSquare,
  Settings,
  Stethoscope,
  Tag,
  Users,
  Wrench,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import type { Permission, RoleType } from "@/types/permissions";

// ── Navigation schema ─────────────────────────────────────────────────────────

interface NavChild {
  name: string;
  href: string;
  permission?: Permission;
  roles?: RoleType[];
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: NavChild[];
  permission?: Permission;
  roles?: RoleType[];
}

const NAV_GROUPS: NavGroup[] = [
  // Tổng quan - Ai cũng thấy
  {
    id: "dashboard", label: "Tổng quan", icon: Home,
    children: [
      { name: "Dashboard", href: "/" },
      { name: "Báo cáo", href: "/reports" },
    ],
  },

  // Bệnh nhân - Ai cũng thấy
  {
    id: "patients", label: "Bệnh nhân", icon: Users,
    children: [
      { name: "Danh sách bệnh nhân", href: "/patients" },
      { name: "Hồ sơ bệnh án", href: "/medical-records" },
    ],
  },

  // Tiếp tân (RECEPTIONIST) - Lập & chỉnh sửa lịch khám, lịch nghỉ phép BS
  {
    id: "receptionist", label: "Tiếp tân", icon: Calendar,
    roles: ["receptionist", "admin"],
    children: [
      { name: "Lịch khám", href: "/appointments" },
      // TODO: { name: "Lịch nghỉ phép BS", href: "/doctor-leaves" },
    ],
  },

  // CSKH (customer_service=true) - Nhắc hẹn, mẫu tin nhắn, khảo sát, chat, hỏi đáp
  {
    id: "cskh", label: "CSKH", icon: MessageSquare,
    roles: ["cskh", "admin"],
    children: [
      { name: "Chat tư vấn", href: "/chats" },
      { name: "Đánh giá", href: "/reviews" },
      // TODO: { name: "Nhắc hẹn tái khám", href: "/cskh/reminders" },
      // TODO: { name: "Mẫu tin nhắn", href: "/cskh/templates" },
      // TODO: { name: "Khảo sát đánh giá", href: "/cskh/surveys" },
      // TODO: { name: "Báo cáo đánh giá", href: "/cskh/reports" },
      // TODO: { name: "Hỏi đáp", href: "/cskh/questions" },
    ],
  },

  // Marketing (marketing=true) - Chương trình KM, quảng cáo, gói khám
  {
    id: "marketing", label: "Marketing", icon: Tag,
    roles: ["marketing", "admin"],
    children: [
      { name: "Chương trình KM", href: "/promotions" },
      // TODO: { name: "Quảng cáo", href: "/marketing/ads" },
      // TODO: { name: "Gói khám", href: "/marketing/packages" },
    ],
  },

  // Kế toán (accountant=true) - Thanh toán, đối soát
  {
    id: "accountant", label: "Kế toán", icon: CreditCard,
    roles: ["accountant", "admin"],
    children: [
      { name: "Thanh toán", href: "/payments" },
      // TODO: { name: "Đối soát ngân hàng", href: "/reconciliation/bank" },
      // TODO: { name: "Đối soát HIS", href: "/reconciliation/his" },
    ],
  },

  // Admin - Đồng bộ phiếu khám, khai báo, hoàn hủy, BC đối soát
  {
    id: "admin-clinical", label: "Lâm sàng", icon: Stethoscope,
    permission: "admin.declare_specialty",
    children: [
      { name: "Khu vực khám", href: "/exam-areas", permission: "admin.manage_exam_room" },
      { name: "Phòng khám", href: "/clinics", permission: "admin.manage_exam_room" },
    ],
  },
  {
    id: "admin-specialties", label: "Chuyên khoa", icon: Stethoscope,
    permission: "admin.declare_specialty",
    children: [
      { name: "Chuyên khoa", href: "/specialties", permission: "admin.declare_specialty" },
      { name: "Bác sĩ", href: "/doctors", permission: "admin.manage_doctor" },
      { name: "Dịch vụ khám", href: "/exam-services", permission: "admin.declare_service_price" },
    ],
  },
  { id: "admin-operations", label: "Vận hành", icon: Wrench, href: "/operations", permission: "admin.all" },

  // Tài khoản nội bộ - Admin only
  {
    id: "internal-accounts", label: "Tài khoản nội bộ", icon: LayoutGrid,
    permission: "user.manage",
    children: [
      { name: "Người dùng", href: "/internal-accounts", permission: "user.manage" },
    ],
  },

  // Nội dung - Ai cũng thấy
  {
    id: "content", label: "Nội dung", icon: BookOpen,
    children: [
      { name: "Tin tức", href: "/content/news" },
      { name: "Danh mục bài viết", href: "/content/categories" },
      { name: "Banner", href: "/content/banners" },
    ],
  },

  // Thông báo - Ai cũng thấy
  { id: "notifications", label: "Thông báo", icon: Bell, href: "/notifications" },

  // Cài đặt - Ai cũng thấy
  { id: "settings", label: "Cài đặt", icon: Settings, href: "/settings" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function isGroupActive(pathname: string, group: NavGroup): boolean {
  if (group.href) {
    if (group.href === "/") return pathname === "/";
    return pathname === group.href || pathname.startsWith(group.href + "/");
  }
  return (
    group.children?.some(
      (c) => pathname === c.href || pathname.startsWith(c.href + "/"),
    ) ?? false
  );
}

// ── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar() {
  const pathname = usePathname();
  const { hasPermission, hasRole } = usePermission();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Check access function
  const checkAccess = (group: NavGroup | NavChild): boolean => {
    if (hasPermission("admin.all")) return true;
    if (group.permission) return hasPermission(group.permission);
    if (group.roles && group.roles.length > 0) {
      return group.roles.some((role) => hasRole(role));
    }
    return true;
  };

  // Filter visible groups
  const visibleGroups = NAV_GROUPS.filter((group) => checkAccess(group));

  // Filter children
  const getVisibleChildren = (children?: NavChild[]) => {
    if (!children) return [];
    return children.filter((child) => checkAccess(child));
  };

  // Toggle group expand/collapse
  const toggleGroup = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Initial expand - run once on mount
  useEffect(() => {
    // Find active group and expand it
    const activeGroup = NAV_GROUPS.find((g) => isGroupActive(pathname, g));
    if (activeGroup?.children) {
      setExpandedIds(new Set([activeGroup.id]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 flex h-screen flex-col border-r border-border bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header: logo + collapse toggle */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        {/* Logo + text wrapped so toggle can stay outside */}
        <div
          className={cn(
            "flex items-center gap-3 min-w-0",
            collapsed ? "justify-center" : "flex-1 min-w-0"
          )}
        >
          <div className={`${collapsed ? "hidden" : "h-12 w-12"} relative shrink-0 overflow-hidden rounded-lg`}>
            <Image
              src="/assets/images/logo.png"
              alt="Van Hanh Hospital"
              fill
              className="object-contain"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-primary-700 leading-tight truncate">Van Hanh</span>
              <span className="text-xs text-muted-foreground leading-tight truncate">Hospital</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed((p) => !p)}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {visibleGroups.map((group) => {
          const Icon = group.icon;
          const active = isGroupActive(pathname, group);
          const isExpanded = expandedIds.has(group.id);
          const visibleChildren = getVisibleChildren(group.children);

          // Neu co children nhung khong co child nao visible → an group luon
          if (group.children && visibleChildren.length === 0) {
            return null;
          }

          if (group.children) {
            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  title={collapsed ? group.label : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-primary-600" : "text-muted-foreground"
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-left">{group.label}</span>
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </>
                  )}
                </button>

                {!collapsed && isExpanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5">
                    {visibleChildren.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                            childActive
                              ? "bg-primary-600 text-white shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={group.id}
              href={group.href || "/"}
              title={collapsed ? group.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  active ? "text-primary-600" : "text-muted-foreground"
                )}
              />
              {!collapsed && <span className="truncate">{group.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
