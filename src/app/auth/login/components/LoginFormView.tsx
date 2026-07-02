"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLoginForm } from "../hooks/useLoginForm";
import {
  FiCalendar,
  FiUsers,
  FiFileText,
  FiShield,
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

const FEATURES = [
  {
    icon: FiCalendar,
    title: "Lịch khám",
    desc: "Theo dõi và xử lý lịch hẹn khám bệnh",
  },
  {
    icon: FiUsers,
    title: "Bệnh nhân",
    desc: "Quản lý hồ sơ và thông tin người bệnh",
  },
  {
    icon: FiFileText,
    title: "Nội dung",
    desc: "Quản lý tin tức, thông báo và video",
  },
  {
    icon: FiShield,
    title: "Bảo mật",
    desc: "Phân quyền và quản lý tài khoản quản trị viên",
  },
];

export function LoginFormView() {
  const { form, loading, handleChange, handleSubmit } = useLoginForm();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/background_login.png')" }}
    >
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 items-center gap-8 px-6 py-10 lg:grid-cols-2 lg:gap-16 lg:px-12">
        {/* ── Left: branding + features ── */}
        <div className="hidden flex-col lg:flex">
          {/* Logo */}
          <div className="mb-12 flex items-center gap-3">
            <Image
              src="/assets/images/logo.png"
              alt="Bệnh viện Vạn Hạnh"
              width={64}
              height={64}
              className="h-16 w-16"
              priority
            />
            <div>
              <p className="text-sm font-bold tracking-wide text-primary-700">BỆNH VIỆN VẠN HẠNH</p>

              <p className="text-sm text-text-slate">Cổng quản trị nội bộ</p>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold leading-tight text-text-navy xl:text-5xl">
            Quản lý vận hành bệnh viện
            <br />
            <span className="text-primary-600">nhanh chóng</span> và an toàn
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-text-slate">
            Hệ thống hỗ trợ quản lý và tối ưu các hoạt động nội bộ của bệnh viện
            như: bệnh nhân, lịch khám, nội dung, thông báo, thanh toán và báo cáo.
          </p>

          {/* Feature cards */}
          <div className="mt-8 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-navy">{f.title}</p>
                    <p className="mt-0.5 text-sm leading-snug text-text-slate">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: login card ── */}
        <div className="mx-auto w-full max-w-md space-y-4">
          {/* Mobile logo */}
          <div className="mb-2 flex items-center justify-center gap-3 lg:hidden">
            <Image
              src="/assets/images/logo.png"
              alt="Bệnh viện Vạn Hạnh"
              width={48}
              height={48}
              className="h-12 w-12"
              priority
            />
            <p className="text-xl font-bold text-primary-700">BỆNH VIỆN VẠN HẠNH</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5 sm:p-10"
          >
            {/* Shield badge */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg">
                <FiShield className="h-7 w-7" />
              </div>
            </div>

            <h2 className="text-center text-2xl font-bold text-text-navy">Đăng nhập</h2>
            <p className="mt-1 text-center text-sm text-text-slate">
              Vui lòng nhập tài khoản quản trị để tiếp tục
            </p>

            <div className="mt-8 space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-text-navy">
                  Email
                </label>
                <div className="relative">
                  <FiUser className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-disabled" />
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="email"
                    required
                    placeholder="admin@vanhanhhospital.com"
                    value={form.email}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-border bg-surface-secondary py-3.5 pl-12 pr-4 text-sm text-text-navy outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-text-navy">
                  Mật khẩu
                </label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-disabled" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-border bg-surface-secondary py-3.5 pl-12 pr-12 text-sm text-text-navy outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-disabled transition hover:text-text-slate"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember + forgot */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-text-navy">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary-600 accent-primary-600 focus:ring-primary-500"
                  />
                  Ghi nhớ đăng nhập
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="h-12 w-full gap-2 rounded-xl text-base"
                disabled={loading}
              >
                <FiLock className="h-4 w-4" />
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </div>

            <p className="mt-8 text-center text-sm text-text-slate">
              © 2026 <span className="font-semibold text-text-navy">Bệnh viện Vạn Hạnh</span>. All rights reserved.
            </p>
          </form>

          {/* Security banner */}
          <div className="flex items-center gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <FiShield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-navy">Bảo mật &amp; an toàn</p>
              <p className="text-sm text-text-slate">
                Hệ thống được bảo vệ với các tiêu chuẩn bảo mật cao nhất
              </p>
            </div>
            <FiLock className="h-8 w-8 text-primary-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
