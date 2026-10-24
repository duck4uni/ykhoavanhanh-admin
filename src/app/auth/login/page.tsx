import { Suspense } from "react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { LoadingPage } from "@/components/ui/Spinner";
import { LoginFormView } from "./components/LoginFormView";

export default function LoginPage() {
  return (
    <ToastProvider>
      {/* `Suspense` bắt buộc: form đọc `?next=` bằng `useSearchParams` (middleware gắn vào khi
          chặn người chưa đăng nhập), mà hook đó không prerender tĩnh được — thiếu Suspense thì
          `next build` lỗi "should be wrapped in a suspense boundary". */}
      <Suspense fallback={<LoadingPage />}>
        <LoginFormView />
      </Suspense>
    </ToastProvider>
  );
}
