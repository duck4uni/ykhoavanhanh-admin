/**
 * Mốc "lần hoạt động cuối" cho cơ chế tự đăng xuất khi không hoạt động.
 *
 * VÌ SAO PHẢI LƯU XUỐNG STORAGE, không chỉ giữ biến trong RAM: nếu chỉ giữ trong module thì mỗi
 * lần F5 là đồng hồ reset -> bỏ máy 2 tiếng, quay lại F5 vẫn còn phiên. Lưu mốc thì tải lại
 * trang vẫn tính đúng khoảng đã trôi qua.
 *
 * VÌ SAO DÙNG localStorage (khác với phiên, nay lưu ở sessionStorage - xem storage.ts): mốc này
 * phải DÙNG CHUNG GIỮA CÁC TAB. Các tab chia sẻ một phiên (xem sessionHandoff.ts) và `/auth/logout`
 * thu hồi refreshToken ở server, nên nếu mỗi tab đếm riêng thì một tab mở quên ở góc màn hình sẽ
 * hết giờ và đăng xuất luôn tab người ta đang làm việc. Mốc này chỉ là một con số thời gian,
 * không có token cũng không có dữ liệu bệnh nhân.
 *
 * Mốc cũ còn lại từ phiên trước là chuyện bình thường (localStorage sống qua lần đóng browser),
 * nên `setAuth` gọi `markActivity()` lúc đăng nhập để đặt lại đồng hồ.
 */

/** Không hoạt động quá 30 phút -> đăng xuất. */
export const IDLE_LIMIT_MS = 30 * 60 * 1000

/** Cảnh báo trước 1 phút, để người đang nhập liệu kịp bấm gì đó giữ phiên. */
export const IDLE_WARN_BEFORE_MS = 60 * 1000

/**
 * Nhịp kiểm tra. Cố tình dùng interval + so sánh mốc thời gian thay vì một `setTimeout` 30 phút:
 * khi laptop sleep rồi wake, `setTimeout` chạy lệch nhịp còn so sánh timestamp thì luôn đúng.
 */
export const IDLE_CHECK_EVERY_MS = 15 * 1000

/** Chặn ghi storage liên tục: mỗi lần gõ/bấm đều cập nhật RAM, nhưng ghi storage tối đa 5s/lần. */
const PERSIST_EVERY_MS = 5 * 1000

export const LAST_ACTIVITY_KEY = 'vh-last-activity'

let lastActivityAt = 0
let lastPersistedAt = 0

function store(): Storage | null {
	if (typeof window === 'undefined') return null
	try {
		return window.localStorage
	} catch {
		// Cửa sổ riêng tư / chặn site data: coi như không có storage, cơ chế vẫn chạy trong RAM.
		return null
	}
}

function write(at: number): void {
	try {
		store()?.setItem(LAST_ACTIVITY_KEY, String(at))
	} catch {
		// Hết quota hoặc bị chặn — không đáng để làm hỏng luồng của người dùng.
	}
}

function readStored(): number | null {
	try {
		const raw = store()?.getItem(LAST_ACTIVITY_KEY)
		if (!raw) return null
		const parsed = Number(raw)
		return Number.isFinite(parsed) ? parsed : null
	} catch {
		return null
	}
}

/**
 * Gọi một lần khi bắt đầu theo dõi. Lấy lại mốc đã lưu nếu có (để F5 không reset đồng hồ),
 * chưa có thì lấy thời điểm hiện tại.
 */
export function initActivity(): number {
	const now = Date.now()
	const stored = readStored()

	// `stored > now` xảy ra khi đồng hồ máy bị đổi về quá khứ. Giữ nguyên giá trị tương lai đó
	// thì `idleFor` ra số âm và phiên không bao giờ hết hạn — nên kẹp về `now`.
	lastActivityAt = stored !== null && stored <= now ? stored : now
	lastPersistedAt = lastActivityAt
	if (stored === null || stored > now) write(lastActivityAt)

	return lastActivityAt
}

/** Ghi nhận một hành động thật của người dùng (bấm chuột, gõ phím, cuộn trang). */
export function markActivity(): void {
	const now = Date.now()
	lastActivityAt = now
	if (now - lastPersistedAt < PERSIST_EVERY_MS) return
	lastPersistedAt = now
	write(now)
}

/**
 * Mốc hoạt động mới nhất, ƯU TIÊN giá trị trong storage: tab khác vừa có hoạt động thì tab này
 * phải thấy, nếu không mỗi tab lại tự đếm riêng.
 */
export function readLastActivity(): number {
	const stored = readStored()
	const now = Date.now()
	if (stored !== null && stored <= now && stored > lastActivityAt) lastActivityAt = stored
	return lastActivityAt || now
}

/** Số ms đã không hoạt động. */
export function idleFor(): number {
	return Date.now() - readLastActivity()
}

/**
 * Xoá mốc khi đăng xuất. BẮT BUỘC, không phải dọn cho đẹp: để lại mốc cũ thì lần đăng nhập sau
 * có thể bị đăng xuất ngay vì đọc được mốc của phiên trước.
 */
export function clearIdleMarker(): void {
	lastActivityAt = 0
	lastPersistedAt = 0
	try {
		store()?.removeItem(LAST_ACTIVITY_KEY)
	} catch {
		// bỏ qua
	}
}
