"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiClock } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { useIsSignedIn } from "@/store/authStore";
import { authService } from "@/api/authApi";

/**
 * Gắn cơ chế tự đăng xuất sau 30 phút không hoạt động, kèm hộp cảnh báo trước 1 phút.
 *
 * Đặt trong `(dashboard)/layout.tsx` nên chỉ chạy ở khu vực đã đăng nhập — không theo dõi ở
 * trang login.
 */
export function IdleLogoutGuard() {
  const router = useRouter();
  const isSignedIn = useIsSignedIn();

  const handleTimeout = useCallback(() => {
    // Gọi `/auth/logout` để backend thu hồi refreshToken. Dùng `authService.logout` chứ không
    // chỉ `resetStore()`: xoá ở client mà refreshToken còn sống ở server thì chưa thật là
    // đăng xuất. `logout()` đã tự bắt lỗi và luôn `resetStore()` ở `finally`, nên mạng lỗi
    // cũng không mắc lại phiên.
    void authService.logout().finally(() => {
      // `replace` chứ không `push`: không để bấm Back quay lại trang vừa bị đăng xuất.
      router.replace("/auth/login?reason=idle");
    });
  }, [router]);

  const { secondsLeft, staySignedIn } = useIdleLogout({
    enabled: isSignedIn,
    onIdleTimeout: handleTimeout,
  });

  if (secondsLeft === null) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-warning-title"
      aria-describedby="idle-warning-desc"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <FiClock className="h-7 w-7" />
        </div>

        <h2 id="idle-warning-title" className="text-center text-lg font-bold text-text-navy">
          Sắp tự đăng xuất
        </h2>
        <p id="idle-warning-desc" className="mt-2 text-center text-sm leading-relaxed text-text-slate">
          Bạn không hoạt động trong 30 phút. Phiên sẽ tự đăng xuất sau{" "}
          <span className="font-semibold text-text-navy">{secondsLeft} giây</span> để bảo vệ dữ
          liệu bệnh nhân trên máy dùng chung.
        </p>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => {
              void authService.logout().finally(() => router.replace("/auth/login"));
            }}
          >
            Đăng xuất
          </Button>
          <Button type="button" variant="primary" className="flex-1" onClick={staySignedIn} autoFocus>
            Tôi vẫn ở đây
          </Button>
        </div>
      </div>
    </div>
  );
}
