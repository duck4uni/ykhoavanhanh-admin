"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { useRolesList } from "@/api/rolesApi";
import { useCreateInternalAccount } from "@/api/internalAccountsApi";

export default function NewInternalAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role_id: "",
  });

  const { data: rolesData, isLoading: rolesLoading } = useRolesList({ pageSize: 100 });

  const createMutation = useCreateInternalAccount({
    onSuccess: () => {
      toast.success("Tạo tài khoản thành công!");
      router.push("/internal-accounts");
    },
    onError: (error) => {
      toast.error(error.message || "Tạo tài khoản thất bại");
    },
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.role_id) {
        toast.error("Vui lòng chọn vai trò");
        return;
      }
      createMutation.mutate({
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role_id: form.role_id,
      });
    },
    [form, createMutation]
  );

  const roleOptions =
    rolesData?.rows.map((role) => ({
      value: role.id,
      label: role.description || role.role_name,
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm tài khoản nội bộ</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tạo tài khoản nhân viên mới
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
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
              <div className="col-span-2">
                {rolesLoading ? (
                  <div className="py-2">
                    <Spinner size="sm" /> Đang tải vai trò...
                  </div>
                ) : (
                  <Select
                    label="Vai trò *"
                    value={form.role_id}
                    onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                    options={roleOptions}
                    placeholder="Chọn vai trò"
                  />
                )}
              </div>
              <div className="col-span-2">
                <Input
                  label="Mật khẩu tạm thời *"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  hint="Tối thiểu 6 ký tự"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Tạo tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500">
                Tài khoản sẽ được tạo với quyền đã chọn. Người dùng sẽ đăng nhập bằng email và mật khẩu.
              </p>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.back()}
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