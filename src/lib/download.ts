/**
 * Tải một Blob về máy người dùng.
 *
 * Trình duyệt không cho JS ghi file trực tiếp, nên cách duy nhất là tạo một
 * object URL rồi "bấm" vào thẻ <a download>. URL đó giữ cả Blob trong bộ nhớ
 * tab cho tới khi revoke — file Excel vài MB mà không revoke thì mỗi lần xuất
 * lại rò thêm bấy nhiêu bộ nhớ.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    // Firefox bỏ qua click() trên thẻ chưa nằm trong DOM.
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Hoãn revoke: Chrome/Safari đọc Blob sau khi click() trả về, revoke ngay
    // sẽ cho ra file rỗng hoặc "Network error".
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/**
 * Lấy tên file từ header `Content-Disposition` (server đặt tên, client không
 * tự đoán). Trả `null` nếu header thiếu — ví dụ khi proxy lọc bớt header hoặc
 * CORS không expose nó — để nơi gọi dùng tên mặc định của mình.
 */
export function filenameFromContentDisposition(header?: string | null): string | null {
  if (!header) return null;
  // RFC 5987: filename*=UTF-8''<percent-encoded> ưu tiên hơn filename="..."
  const encoded = /filename\*=\s*UTF-8''([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      // Chuỗi percent-encode lỗi -> thử tiếp dạng filename thường.
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}
