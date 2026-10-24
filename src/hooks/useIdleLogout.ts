"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IDLE_CHECK_EVERY_MS,
  IDLE_LIMIT_MS,
  IDLE_WARN_BEFORE_MS,
  idleFor,
  initActivity,
  markActivity,
} from "@/utils/idleTimeout";

/**
 * Tự đăng xuất sau 30 phút không hoạt động, có cảnh báo trước 1 phút.
 *
 * VÌ SAO CẦN: máy ở quầy tiếp tân dùng chung. Nhân viên đứng lên đi mà không đăng xuất thì
 * người kế tiếp đang ở trong phiên của họ — xem được hồ sơ bệnh nhân, danh sách thanh toán.
 * Đây là rủi ro thật, khác hẳn chuyện "mở F12" (người mở F12 đã đăng nhập, chỉ thấy token
 * của chính họ).
 *
 * CÁCH ĐẾM: so sánh mốc thời gian mỗi 15 giây, KHÔNG dùng `setTimeout(30 phút)`. Lý do: laptop
 * sleep thì timer đứng hoặc chạy lệch, còn so sánh `Date.now()` luôn đúng — máy sleep 2 tiếng
 * rồi mở nắp là hết phiên ngay, đúng như mong đợi.
 *
 * KHÔNG tính request mạng là hoạt động: polling của react-query chạy nền sẽ giữ phiên sống mãi
 * dù không ai ngồi trước máy. Chỉ đếm hành động thật của con người.
 */

/** Sự kiện coi là "có người đang dùng máy". Không có `mousemove` — chuột rung do xe đẩy đi qua. */
const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "wheel",
  "click",
] as const;

type UseIdleLogoutOptions = {
  /** Chỉ theo dõi khi đã đăng nhập. */
  enabled: boolean;
  /** Gọi khi hết 30 phút. Nơi gọi tự quyết định đăng xuất thế nào. */
  onIdleTimeout: () => void;
};

type UseIdleLogoutResult = {
  /** Số giây còn lại, chỉ khác `null` khi đang trong 1 phút cảnh báo. */
  secondsLeft: number | null;
  /** Người dùng bấm "Tôi vẫn ở đây" -> đặt lại đồng hồ. */
  staySignedIn: () => void;
};

export function useIdleLogout({ enabled, onIdleTimeout }: UseIdleLogoutOptions): UseIdleLogoutResult {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Giữ callback trong ref: nơi gọi thường truyền arrow function mới mỗi lần render, để thẳng
  // vào deps của useEffect là gắn/tháo listener liên tục.
  const onIdleTimeoutRef = useRef(onIdleTimeout);
  onIdleTimeoutRef.current = onIdleTimeout;

  // Chặn gọi `onIdleTimeout` nhiều lần (interval + lần kiểm tra khi quay lại tab có thể trùng).
  const firedRef = useRef(false);

  const staySignedIn = useCallback(() => {
    markActivity();
    setSecondsLeft(null);
  }, []);

  useEffect(() => {
    if (!enabled) {
      firedRef.current = false;
      setSecondsLeft(null);
      return;
    }

    initActivity();
    firedRef.current = false;

    const check = () => {
      if (firedRef.current) return;

      const idle = idleFor();

      if (idle >= IDLE_LIMIT_MS) {
        firedRef.current = true;
        setSecondsLeft(null);
        onIdleTimeoutRef.current();
        return;
      }

      const remaining = IDLE_LIMIT_MS - idle;
      // `Math.ceil` để không bao giờ hiện "0 giây" mà vẫn chưa đăng xuất.
      setSecondsLeft(remaining <= IDLE_WARN_BEFORE_MS ? Math.ceil(remaining / 1000) : null);
    };

    const onActivity = () => {
      if (firedRef.current) return;
      markActivity();
      // Không gọi `setSecondsLeft(null)` vô điều kiện: làm vậy là mỗi lần cuộn trang đều
      // set state và render lại cả cây. Chỉ dọn khi đang thực sự hiện cảnh báo.
      setSecondsLeft((prev) => (prev === null ? prev : null));
    };

    // Quay lại tab sau khi máy sleep: kiểm tra ngay, không chờ hết 15 giây của interval.
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", onVisible);

    check();
    const timer = window.setInterval(check, IDLE_CHECK_EVERY_MS);

    return () => {
      window.clearInterval(timer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);

  return { secondsLeft, staySignedIn };
}
