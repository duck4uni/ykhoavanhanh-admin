/**
 * Cookie báo hiệu "phiên này đã đăng nhập" cho `middleware.ts` đọc.
 *
 * VÌ SAO CẦN: token nằm trong `sessionStorage` (xem storage.ts), còn middleware chạy TRÊN SERVER
 * nên không đọc được storage của browser — nó chỉ thấy cookie. Không có tín hiệu dạng cookie thì
 * middleware không thể biết khách đã đăng nhập hay chưa, và sẽ đẩy cả người đang đăng nhập về
 * trang login.
 *
 * CỐ Ý KHÔNG ĐẶT TOKEN VÀO ĐÂY. Cookie này chỉ mang đúng một chữ "1". Lý do:
 *   - Cookie do client ghi (không `httpOnly`) nên ai cũng sửa được — đặt token vào đây không
 *     an toàn hơn storage của browser mà còn thêm một chỗ rò (cookie tự gửi kèm mọi request).
 *   - Vì vậy cookie này KHÔNG phải cơ chế xác thực. Nó là tín hiệu UX: để middleware chặn sớm
 *     người gõ thẳng URL, thay vì cho họ thấy spinner rồi mới nháy về login.
 *
 * Ranh giới bảo mật thật vẫn là backend: mọi request đều phải mang Bearer accessToken (JWT ký
 * bằng secret phía server, không giả được), và backend kiểm quyền đọc tươi từ DB mỗi request.
 * Giả cookie này chỉ vào xem được khung trang rỗng — không có dữ liệu nào trả về.
 */

export const AUTH_COOKIE_NAME = 'vh-signed-in';

/**
 * Ghi/xoá cookie theo trạng thái đăng nhập. Gọi từ tầng persist của store (storage.ts) nên
 * luôn khớp với những gì thực sự được lưu — không có đường nào đăng nhập/đăng xuất mà bỏ sót.
 */
export function syncAuthCookie(isSignedIn: boolean): void {
	if (typeof document === 'undefined') return;

	// `SameSite=Lax`: cookie vẫn được gửi khi điều hướng bình thường (gõ URL, bấm link từ ngoài)
	// nên middleware thấy được, nhưng không gửi trong request cross-site dạng POST/iframe.
	// `Secure` chỉ thêm khi đang chạy https — thêm trên http local thì browser bỏ cookie đi luôn.
	const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';

	if (isSignedIn) {
		// Không đặt `Expires`/`Max-Age` -> cookie phiên, đóng browser là mất. Khớp với ý nghĩa
		// "đang có phiên" và không để lại dấu vết trên máy dùng chung (máy ở quầy tiếp tân).
		document.cookie = `${AUTH_COOKIE_NAME}=1; Path=/; SameSite=Lax${secure}`;
	} else {
		document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
	}
}
