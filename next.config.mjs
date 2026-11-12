/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Host của backend, lấy từ chính biến môi trường app đang dùng để gọi API.
 * Hard-code host vào đây sẽ vỡ khi đổi môi trường (dev/stag/prod), nên đọc từ env;
 * không có env thì chỉ còn 'self' — thà lỗi thấy ngay lúc dev hơn là mở toang.
 */
function apiOrigin() {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

const API_ORIGIN = apiOrigin();

/**
 * Content-Security-Policy.
 *
 * LƯU Ý VỀ `'unsafe-inline'` TRONG script-src: Next.js tự chèn script inline (bootstrap +
 * dữ liệu hydration) nên muốn bỏ `'unsafe-inline'` thì phải phát nonce theo từng request
 * bằng middleware — đổi lại sẽ tắt được static optimization của mọi trang. Đây là portal nội
 * bộ, nên chọn: giữ `'unsafe-inline'` nhưng ĐÓNG các hướng còn lại (không cho tải script từ
 * domain ngoài, không cho nhúng iframe, chốt `connect-src` về đúng backend). Tức là CSP ở đây
 * KHÔNG phải tuyến phòng thủ XSS chính — tuyến đó là `sanitizeHtml` ở src/lib/sanitizeHtml.ts.
 * Nếu sau này muốn siết thật thì thêm nonce middleware rồi bỏ 'unsafe-inline' ở đây.
 */
const csp = [
  "default-src 'self'",
  // `'unsafe-eval'` chỉ ở dev (React Refresh / HMR cần), production thì không.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  // Tailwind + styled-jsx chèn style inline -> buộc phải cho 'unsafe-inline' cho style.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // `data:`/`blob:` cho ảnh dán từ trình soạn thảo và preview file trước khi upload.
  `img-src 'self' data: blob:${API_ORIGIN ? ` ${API_ORIGIN}` : ''} https:`,
  `connect-src 'self'${API_ORIGIN ? ` ${API_ORIGIN}` : ''}${isDev ? ' ws: wss:' : ''}`,
  // Không nhúng Flash/applet, không cho <object>/<embed> — đường chạy mã cũ.
  "object-src 'none'",
  // Chặn <base href> bị chèn để đổi đích của mọi link/script tương đối.
  "base-uri 'self'",
  // Form không được post sang domain khác (chặn kiểu chèn form đánh cắp thông tin).
  "form-action 'self'",
  // Tương đương X-Frame-Options: DENY nhưng chuẩn mới — chặn clickjacking.
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // Không để browser "đoán" MIME type (file upload trả về text lại bị chạy như HTML/JS).
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Giữ cho tương thích browser cũ chưa hiểu frame-ancestors.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Không rò URL nội bộ (kèm id bệnh nhân trong path) sang site ngoài qua Referer.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Portal này không dùng camera/mic/vị trí -> tắt hẳn, script chèn vào cũng không xin được.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()',
  },
  // Chặn tải dữ liệu cross-origin không cần thiết vào tài liệu này.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig = {
  reactStrictMode: true,
  // Ẩn header `X-Powered-By: Next.js` — không cần nói cho người ngoài biết stack + version.
  poweredByHeader: false,
  images: {
    // Trước đây là `hostname: '**'` -> bất kỳ host https nào cũng proxy được qua
    // /_next/image của portal (biến server thành open image proxy, và tốn băng thông).
    // Giờ chỉ cho backend thật + host đang dùng trong code.
    remotePatterns: [
      ...(API_ORIGIN
        ? [{ protocol: new URL(API_ORIGIN).protocol.replace(':', ''), hostname: new URL(API_ORIGIN).hostname }]
        : []),
      // Avatar mẫu trong dữ liệu chat demo (src/api/chatApi.ts).
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
