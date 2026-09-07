"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { LoadingPage } from "@/components/ui/Spinner";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { useIsSignedIn, useAuthLoading } from "@/store/authStore";
import { useGetMyInfo } from "@/api/authApi";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isSignedIn = useIsSignedIn();
  const isLoading = useAuthLoading();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Luôn gọi API lấy thông tin user khi đã signed in
  useGetMyInfo();

  useEffect(() => {
    // Wait for auth store to be hydrated from localStorage
    if (!isLoading) {
      if (!isSignedIn) {
        router.replace("/auth/login");
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [isSignedIn, isLoading, router]);

  if (isCheckingAuth || isLoading) {
    return <LoadingPage />;
  }

  return (
    <ToastProvider>
      {/* ── Tablet / mobile block ── */}
      <div className="flex lg:hidden min-h-dvh items-center justify-center bg-gradient-to-br from-primary-950 to-primary-900 p-8">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="mb-6 flex size-24 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 shadow-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-12 text-white/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Yêu cầu màn hình lớn hơn</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Hệ thống quản lý Bệnh Viện Vạn Hạnh yêu cầu màn hình máy tính hoặc laptop để sử dụng.
          </p>
        </div>
      </div>

      {/* ── Desktop layout (lg+) ── */}
      <div className="hidden lg:flex min-h-dvh bg-background">
        {/* Left sidebar */}
        <AppSidebar />

        {/* Right content area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Sticky top header — 72px */}
          <AppHeader />

          {/* Main content area */}
          <main
            id="main-content"
            className="flex-1"
            tabIndex={-1}
          >
            <div className="w-full px-6 py-7 xl:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
