"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { LoadingSection } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { useUserById, useUpdateUser } from "@/api/userApi";
import { useRolesList } from "@/api/rolesApi";
import { useUserRolesList, useCreateUserRole, useDeleteUserRole } from "@/api/userRolesApi";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { ROLE_LABELS, type RoleType } from "@/types/permissions";

export default function EditInternalAccountPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    isActive: true,
  });

  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState("");

  const { data: apiUser, isLoading: userLoading } = useUserById(userId);
  const { data: rolesData, isLoading: rolesLoading } = useRolesList({ pageSize: 100 });
  const { data: userRolesData, isLoading: userRolesLoading } = useUserRolesList({
    user_id: userId,
    pageSize: 100,
  });

  const updateUser = useUpdateUser({
    onSuccess: () => {
      toast.success("Cập nhật thông tin thành công!");
      router.push(`/internal-accounts/${userId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Cập nhật thất bại");
    },
  });

  const addRoleMutation = useCreateUserRole({
    onSuccess: () => {
      toast.success("Gán vai trò thành công!");
      setSelectedRoleToAdd("");
    },
    onError: (error) => {
      toast.error(error.message || "Gán vai trò thất bại");
    },
  });

  const removeRoleMutation = useDeleteUserRole({
    onSuccess: () => {
      toast.success("Gỡ vai trò thành công!");
    },
    onError: (error) => {
      toast.error(error.message || "Gỡ vai trò thất bại");
    },
  });

  useEffect(() => {
    if (apiUser && !updateUser.isPending) {
      setForm({
        fullName: apiUser.full_name ?? "",
        email: apiUser.email ?? "",
        phone: apiUser.phone ?? "",
        isActive: apiUser.is_active ?? true,
      });
    }
  }, [apiUser, updateUser.isPending]);

  // Roles that are already assigned
  const assignedRoleIds = new Set(userRolesData?.rows.map((ur) => ur.role_id) || []);

  // Available roles to add (not yet assigned) - chỉ hiển thị roles chưa gán và có id hợp lệ
  const availableRoles = rolesData?.rows
    .filter((role) => role.id && role.id.trim() !== "" && !assignedRoleIds.has(role.id))
    .map((role) => {
      // Xác định role_type từ các flag boolean - ưu tiên ADMIN
      let roleType: RoleType = "admin";
      const roleName = (role.role_name || "").toLowerCase();

      // ADMIN có tất cả flags = true hoặc role_name chứa "admin"
      if (
        (role.accountant && role.customer_service && role.marketing && role.receptionist) ||
        roleName.includes("admin")
      ) {
        roleType = "admin";
      } else if (role.accountant) {
        roleType = "accountant";
      } else if (role.customer_service) {
        roleType = "cskh";
      } else if (role.marketing) {
        roleType = "marketing";
      } else if (role.receptionist) {
        roleType = "receptionist";
      }

      return {
        value: role.id,
        label: `${role.description || role.role_name} (${ROLE_LABELS[roleType]})`,
      };
    }) || [];

  // Current user roles
  const currentRoles = userRolesData?.rows || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser.mutate({
      id: userId,
      payload: {
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        is_active: form.isActive,
      },
    });
  };

  const handleAddRole = () => {
    if (!selectedRoleToAdd) return;
    addRoleMutation.mutate({ user_id: userId, role_id: selectedRoleToAdd });
  };

  if (userLoading || rolesLoading || userRolesLoading) {
    return <LoadingSection text="Đang tải thông tin..." />;
  }

  if (!apiUser) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Không tìm thấy tài khoản.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa tài khoản</h1>
          <p className="text-sm text-gray-500 mt-0.5">{form.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="Họ và tên *"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <Input
                label="Email *"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vai trò</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Quản lý vai trò của tài khoản.
              </p>

              {/* Current roles with remove option */}
              {currentRoles.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Vai trò hiện tại:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentRoles.map((ur) => (
                      <Badge key={ur.id} variant="info" className="flex items-center gap-2">
                        <span>{ur.role.description || ur.role.role_name}</span>
                        <PermissionGuard permission="user.assign_role">
                          <button
                            type="button"
                            onClick={() => removeRoleMutation.mutate(ur.id)}
                            disabled={removeRoleMutation.isPending}
                            className="text-xs hover:text-destructive ml-1"
                          >
                            ✕
                          </button>
                        </PermissionGuard>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa có vai trò nào.</p>
              )}

              {/* Add new role - chỉ admin mới thấy */}
              <PermissionGuard permission="user.assign_role">
                <div className="flex items-end gap-2 pt-2">
                  <div className="flex-1">
                    <Select
                      value={selectedRoleToAdd}
                      onValueChange={setSelectedRoleToAdd}
                      options={availableRoles}
                      placeholder={availableRoles.length > 0 ? "Chọn vai trò cần thêm" : "Tất cả vai trò đã được gán"}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddRole}
                    disabled={!selectedRoleToAdd || addRoleMutation.isPending || availableRoles.length === 0}
                  >
                    Thêm vai trò
                  </Button>
                </div>
              </PermissionGuard>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Lưu thay đổi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Kích hoạt tài khoản
                </span>
                <Toggle
                  checked={form.isActive}
                  onChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={updateUser.isPending}
              >
                {updateUser.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push(`/internal-accounts/${userId}`)}
              >
                Hủy
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}