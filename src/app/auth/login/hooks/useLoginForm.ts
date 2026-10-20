"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLogin } from "@/api/authApi";
import { useAuthStore } from "@/store/authStore";

export function useLoginForm() {
  const router = useRouter();
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
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, handleChange, handleSubmit };
}
