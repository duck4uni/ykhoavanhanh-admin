"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PermissionGuard, AccessDenied } from "@/components/auth/PermissionGuard";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/his-catalogs/countries", label: "Quốc gia" },
  { href: "/his-catalogs/provinces", label: "Tỉnh/Thành" },
  { href: "/his-catalogs/districts", label: "Quận/Huyện" },
  { href: "/his-catalogs/wards", label: "Phường/Xã" },
  { href: "/his-catalogs/nations", label: "Dân tộc" },
  { href: "/his-catalogs/professions", label: "Nghề nghiệp" },
] as const;

export default function HisCatalogsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <PermissionGuard permission="admin.all" fallback={<AccessDenied message="Bạn không có quyền quản lý danh mục HIS" />}>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Danh mục HIS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Danh mục dùng chung đồng bộ từ HIS (Quốc gia, Tỉnh/Thành, Quận/Huyện, Phường/Xã, Dân tộc, Nghề nghiệp).
          </p>
        </div>

        <div className="overflow-x-auto border-b border-gray-200">
          <nav className="flex min-w-max gap-6">
            {TABS.map((tab) => {
              const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "inline-flex h-11 items-center border-b-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-primary-600"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {children}
      </div>
    </PermissionGuard>
  );
}
