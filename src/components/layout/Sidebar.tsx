"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBook,
  FiCalendar,
  FiChevronDown,
  FiCreditCard,
  FiHome,
  FiLogOut,
  FiLayers,
  FiMapPin,
  FiSettings,
  FiStar,
  FiTag,
  FiUser,
  FiUsers,
  FiMessageCircle,
} from "react-icons/fi";
import { authService } from "@/api/authApi";
import { logout } from "@/store/authStore";
import { usePermission } from "@/hooks/usePermission";
import type { Permission, RoleType } from "@/types/permissions";

interface NavChild {
  name: string;
  href: string;
  permission?: Permission;
  roles?: RoleType[];
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: NavChild[];
  permission?: Permission;
  roles?: RoleType[];
}

const navigation: NavItem[] = [
  // Admin only - Quản lý hệ thống
  { name: "Quản lý chuyên khoa", href: "/specialties", icon: FiActivity, permission: "admin.declare_specialty" },
  { name: "Khu vực khám bệnh", href: "/exam-areas", icon: FiMapPin, permission: "admin.manage_exam_room" },
  { name: "Quản lý phòng khám", href: "/clinics", icon: FiLayers, permission: "admin.manage_exam_room" },
  { name: "Quản lý bác sĩ", href: "/doctors", icon: FiUser, permission: "admin.manage_doctor" },
  { name: "Quản lý dịch vụ khám", href: "/exam-services", icon: FiCreditCard, permission: "admin.declare_service_price" },
  { name: "Tài khoản nội bộ", href: "/internal-accounts", icon: FiUsers, permission: "user.manage" },
  { name: "Vai trò & Quyền", href: "/roles", icon: FiSettings, permission: "user.assign_role" },

  // Receptionist - Tiếp tân
  { name: "Quản lý lịch khám", href: "/appointments", icon: FiCalendar, roles: ["receptionist"] },
  { name: "Lịch nghỉ phép BS", href: "/doctor-leaves", icon: FiCalendar, roles: ["receptionist"] },

  // CSKH - Chăm sóc khách hàng
  {
    name: "CSKH",
    icon: FiMessageCircle,
    roles: ["cskh"],
    children: [
      { name: "Nhắc hẹn tái khám", href: "/cskh/reminders", permission: "cskh.schedule_reminder" },
      { name: "Mẫu tin nhắn", href: "/cskh/templates", permission: "cskh.message_template" },
      { name: "Khảo sát đánh giá", href: "/cskh/surveys", permission: "cskh.survey" },
      { name: "Báo cáo đánh giá", href: "/cskh/reports", permission: "cskh.report_survey" },
      { name: "Chat tư vấn", href: "/cskh/chat", permission: "cskh.chat" },
      { name: "Hỏi đáp", href: "/cskh/questions", permission: "cskh.answer_question" },
    ],
  },

  // Marketing
  {
    name: "Marketing",
    icon: FiTag,
    roles: ["marketing"],
    children: [
      { name: "Chương trình KM", href: "/promotions", permission: "marketing.promotion" },
      { name: "Quảng cáo", href: "/marketing/ads", permission: "marketing.advertisement" },
      { name: "Gói khám", href: "/marketing/packages", permission: "marketing.sell_package" },
    ],
  },

  // Accountant - Kế toán
  { name: "Thanh toán", href: "/payments", icon: FiCreditCard, roles: ["accountant"] },
  { name: "Đối soát ngân hàng", href: "/reconciliation/bank", icon: FiBarChart2, permission: "accountant.report_bank" },
  { name: "Đối soát HIS", href: "/reconciliation/his", icon: FiBarChart2, permission: "accountant.report_his" },

  // Tất cả roles đều thấy
  { name: "Bảng điều khiển", href: "/", icon: FiHome },
  {
    name: "Bệnh nhân",
    icon: FiUsers,
    children: [
      { name: "Danh sách bệnh nhân", href: "/patients" },
      { name: "Hồ sơ sức khỏe", href: "/medical-records" },
    ],
  },
  // {
  //   name: "Vận hành",
  //   icon: FiTool,
  //   roles: ["admin"],
  //   children: [{ name: "Công cụ admin", href: "/operations" }],
  // },
  {
    name: "Membership",
    icon: FiAward,
    children: [
      { name: "Thành viên", href: "/membership" },
      { name: "Quản lý điểm", href: "/membership/points" },
      { name: "Quà tặng", href: "/membership/gifts" },
      { name: "Voucher", href: "/membership/vouchers" },
    ],
  },
  {
    name: "Nội dung",
    icon: FiBook,
    children: [
      { name: "Tin tức", href: "/content/news" },
      { name: "Video / Livestream", href: "/content/videos" },
    ],
  },
  { name: "Đánh giá", href: "/reviews", icon: FiStar },
  { name: "Thông báo", href: "/notifications", icon: FiBell },
  { name: "Báo cáo", href: "/reports", icon: FiBarChart2, roles: ["admin", "accountant"] },
  { name: "Người dùng", href: "/users", icon: FiUser },
  { name: "Cài đặt", href: "/settings", icon: FiSettings },
];

function getActiveChild(pathname: string, children: NavChild[]) {
  return [...children].sort((a, b) => b.href.length - a.href.length).find((child) =>
    pathname === child.href || pathname.startsWith(child.href + "/")
  )?.href ?? null;
}

function isGroupActive(pathname: string, item: NavItem) {
  const child = item.children ? Boolean(getActiveChild(pathname, item.children)) : false;
  if (child) return true;
  if (!item.href) return false;
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, hasRole } = usePermission();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Helper function to check if user has access to an item
  const hasAccess = (item: NavItem | NavChild): boolean => {
    // Admin có tất cả quyền
    if (hasPermission("admin.all")) return true;

    // Kiểm tra permission cụ thể
    if (item.permission) {
      return hasPermission(item.permission);
    }

    // Kiểm tra roles
    if (item.roles && item.roles.length > 0) {
      return item.roles.some((role) => hasRole(role));
    }

    // Không có restriction → ai cũng thấy
    return true;
  };

  // Filter navigation items based on permissions
  const visibleNavItems = navigation.filter((item) => hasAccess(item));

  // Filter children of a nav item
  const getVisibleChildren = (children?: NavChild[]) => {
    if (!children) return [];
    return children.filter((child) => hasAccess(child));
  };

  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    visibleNavItems.forEach((item) => {
      if (item.children && isGroupActive(pathname, item)) expanded.add(item.name);
    });
    return expanded;
  });

  useEffect(() => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      visibleNavItems.forEach((item) => {
        if (item.children && isGroupActive(pathname, item)) next.add(item.name);
      });
      return next;
    });
  }, [pathname, visibleNavItems]);

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch {}
    logout();
    router.replace("/auth/login");
  };

  return (
    <aside
      className={cn(
        "sidebar-scroll flex h-full flex-shrink-0 flex-col overflow-hidden bg-gray-900 transition-all duration-300",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div
        className={cn(
          "flex flex-shrink-0 items-center justify-center border-b border-gray-700 px-5 py-4",
          !isOpen && "px-2"
        )}
      >
        <div className={cn("flex items-center justify-center", isOpen ? "w-40" : "w-8")}>
          <Image
            src="/logo/logo-vanhanh.svg"
            alt="Bệnh Viện Vạn Hạnh"
            width={isOpen ? 160 : 32}
            height={isOpen ? 40 : 32}
            className="h-auto max-w-full"
          />
        </div>
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isGroupActive(pathname, item);
          const visibleChildren = getVisibleChildren(item.children);

          // Nếu có children nhưng không có child nào visible → ẩn menu cha luôn
          if (item.children && visibleChildren.length === 0) {
            return null;
          }

          if (item.children) {
            const isExpanded = expandedItems.has(item.name);
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleExpanded(item.name)}
                  title={!isOpen ? item.name : undefined}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-3",
                    active ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white",
                    !isOpen && "justify-center"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {isOpen && (
                    <>
                      <span className="flex-1 truncate text-left">{item.name}</span>
                      <FiChevronDown
                        className={cn("h-4 w-4 flex-shrink-0 transition-transform", isExpanded && "rotate-180")}
                      />
                    </>
                  )}
                </button>
                {isOpen && isExpanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5">
                    {visibleChildren.map((child) => {
                      const exactMatchExists = visibleChildren.some((entry) => pathname === entry.href);
                      const childActive =
                        pathname === child.href || (!exactMatchExists && pathname.startsWith(child.href + "/"));
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                            childActive ? "bg-primary-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
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
              key={item.href}
              href={item.href!}
              title={!isOpen ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white",
                !isOpen && "justify-center"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {isOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("flex-shrink-0 border-t border-gray-700 px-3 py-4", !isOpen && "px-2")}>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={!isOpen ? "Đăng xuất" : undefined}
          className={cn(
            "w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-red-400 disabled:opacity-50 flex items-center gap-3",
            !isOpen && "justify-center px-2"
          )}
        >
          <FiLogOut className="h-4 w-4 flex-shrink-0" />
          {isOpen && <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>}
        </button>
      </div>
    </aside>
  );
}
