"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useUserById } from "@/api/userApi";
import { useUserRolesList } from "@/api/userRolesApi";
import { LoadingSection } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { data: user, isLoading, error } = useUserById(userId);
  // Vai trò THẬT của user, thay vì suy ra từ cờ is_admin.
  const { data: userRoles } = useUserRolesList({ user_id: userId, pageSize: 100 });

  if (isLoading) {
    return <LoadingSection text="Đang tải thông tin người dùng..." />;
  }

  if (error || !user) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error?.message || "Không tìm thấy người dùng."}</p>
        <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  const roleNames = [
    ...new Set(
      (userRoles?.rows ?? [])
        .map((ur) => (ur.role?.description || ur.role?.role_name || "").trim())
        .filter(Boolean),
    ),
  ];
  const roleLabel = user.is_admin
    ? "Super Admin"
    : roleNames.length > 0
      ? roleNames.join(", ")
      : "Người dùng";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>← Quay lại</Button>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết người dùng</h1>
        </div>
        <Link href={`/users/${userId}/edit`}>
          <Button variant="outline" size="sm">Chỉnh sửa</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar
              src={user.avatar || user.zalo_avatar || undefined}
              name={user.full_name || user.phone || "?"}
              size="lg"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.full_name || user.phone || "Chưa có tên"}
              </h2>
              <Badge variant="info" className="mt-1">{roleLabel}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="font-medium ml-2">{user.email || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Điện thoại:</span>
              <span className="font-medium ml-2">{user.phone || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái:</span>
              <Badge variant={user.is_active ? "success" : "default"} className="ml-2">
                {user.is_active ? "Hoạt động" : "Tạm khóa"}
              </Badge>
            </div>
            <div>
              <span className="text-gray-500">Ngày tạo:</span>
              <span className="font-medium ml-2">
                {user.created_at ? formatDate(user.created_at) : "—"}
              </span>
            </div>
            {user.zalo_id && (
              <div>
                <span className="text-gray-500">Zalo ID:</span>
                <span className="font-medium ml-2">{user.zalo_id}</span>
              </div>
            )}
            {user.address && (
              <div className="col-span-2">
                <span className="text-gray-500">Địa chỉ:</span>
                <span className="font-medium ml-2">{user.address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
