"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiChevronDown, FiLogOut, FiMenu } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { authService } from "@/api/authApi";
import { useAuthStore, logout } from "@/store/authStore";
import { AdminRole, AdminUser } from "@/types/user";

const roleLabels: Record<AdminRole, string> = {
  super_admin: "Quản trị viên",
  admin_content: "Biên tập nội dung",
  admin_membership: "Quản lý Membership",
  cskh: "CSKH",
  doctor: "Bác sĩ",
};

/**
 * Nhãn vai trò hiển thị. `AdminRole` là union legacy và chỉ đặt được cho super
 * admin, nên ưu tiên tên vai trò thật từ `userRoles[]`.
 */
function getUserDisplayRole(user: AdminUser): string {
  if (user.is_admin) return "Super Admin";
  const roleNames = [
    ...new Set(
      (user.userRoles ?? [])
        .map((ur) => (ur.description || ur.roleName || "").trim())
        .filter(Boolean),
    ),
  ];
  if (roleNames.length > 0) return roleNames.join(", ");
  return (user.role && roleLabels[user.role]) || "Nhân viên";
}

const moduleTitleMap: Record<string, string> = {
  "/": "Bảng điều khiển",
  "/patients": "Quản lý bệnh nhân",
  "/medical-records": "Hồ sơ sức khỏe",
  "/specialties": "Quản lý chuyên khoa",
  "/exam-areas": "Khu vực khám bệnh",
  "/clinics": "Quản lý phòng khám",
  "/doctors": "Quản lý bác sĩ",
  "/exam-services": "Quản lý dịch vụ khám",
  "/appointments": "Quản lý lịch khám",
  "/operations": "Công cụ vận hành khám bệnh",
  "/membership": "Membership",
  "/membership/points": "Quản lý điểm",
  "/membership/gifts": "Quà tặng",
  "/membership/vouchers": "Voucher",
  // "/content/articles": "Bài viết sức khỏe",
  "/content/news": "Tin tức",
  "/content/videos": "Video / Livestream",
  "/promotions": "Khuyến mãi",
  "/payments": "Thanh toán",
  "/reviews": "Đánh giá",
  "/notifications": "Thông báo",
  "/reports": "Báo cáo thống kê",
  "/users": "Người dùng",
  "/settings": "Cài đặt",
};

function getPageTitle(pathname: string): string {
  const sorted = Object.keys(moduleTitleMap).sort((a, b) => b.length - a.length);
  const match = sorted.find((key) => pathname === key || (key !== "/" && pathname.startsWith(key + "/")));
  return match ? moduleTitleMap[match] : "Bệnh Viện Vạn Hạnh";
}

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const cached = useAuthStore.getState().user;
    if (cached) {
      setCurrentUser(cached);
      return;
    }
    if (!useAuthStore.getState().isSignedIn) return;
    authService.getMyInfo().then((user) => {
      if (user) setCurrentUser(user);
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    logout();
    router.replace("/auth/login");
  };

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
          aria-label="Toggle sidebar"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-gray-800">{getPageTitle(pathname)}</h1>
      </div>

      <div className="flex items-center gap-2">
        {currentUser && (
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-50"
            >
              <Avatar name={currentUser.fullName} size="sm" />
              <div className="hidden items-start sm:flex sm:flex-col">
                <span className="text-sm font-medium text-gray-700">{currentUser.fullName}</span>
                <span className="text-xs text-gray-500">{getUserDisplayRole(currentUser)}</span>
              </div>
              <FiChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900">{currentUser.fullName}</p>
                  <p className="mb-1 text-xs text-gray-500">{currentUser.email}</p>
                  <Badge variant="info" className="text-xs">
                    {getUserDisplayRole(currentUser)}
                  </Badge>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <FiLogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
