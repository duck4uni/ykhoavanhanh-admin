"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useLogin } from "@/api/authApi";
import { useAuthStore } from "@/store/authStore";

/**
 * Lấy đường dẫn quay về từ `?next=` do `middleware.ts` gắn vào.
 *
 * CHỈ nhận đường dẫn nội bộ bắt đầu bằng một dấu `/`. Tin thẳng giá trị này là mở lỗ
 * open-redirect: `?next=https://evil.tld` hay `?next=//evil.tld` sẽ đẩy người vừa đăng nhập
 * sang site ngoài — site đó dựng bản sao trang login để lấy mật khẩu lần nữa.
 */
function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/")) return "/";
  // `//host` và `/\host` bị browser hiểu là URL tuyệt đối sang host khác.
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `?reason=idle` do `IdleLogoutGuard` gắn vào khi tự đăng xuất. Không có thông báo thì người
  // dùng tưởng hệ thống lỗi / tự thoát vô cớ.
  const signedOutForIdle = searchParams.get("reason") === "idle";
  const setAuth = useAuthStore((state) => state.setAuth);
  const loginMutation = useLogin();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Real API login - use phone as identifier
      const res = await loginMutation.mutateAsync({
        email: form.email, 
        password: form.password,
      });
      setAuth({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expiresIn: res.expiresIn,
      });
      toast.success("Đăng nhập thành công!");
      router.push(safeNextPath(searchParams.get("next")));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, handleChange, handleSubmit, signedOutForIdle };
}
