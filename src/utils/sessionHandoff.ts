/**
 * Chuyển phiên sang tab mới.
 *
 * VẤN ĐỀ: phiên nay lưu ở `sessionStorage` (để đóng browser là mất phiên), mà `sessionStorage`
 * RIÊNG TỪNG TAB. Mở link ra tab mới / nhân bản tab là tab đó trắng phiên. Tệ hơn: cookie
 * `vh-signed-in` lại là cookie PHIÊN BROWSER nên DÙNG CHUNG giữa các tab -> tab mới có cookie
 * mà không có token, middleware cho vào `/`, layout đẩy về `/auth/login`, middleware thấy cookie
 * lại đẩy về `/` -> lặp vô hạn.
 *
 * CÁCH XỬ LÝ: tab mới hỏi các tab đang mở "cho tôi phiên với", tab nào còn phiên thì đáp lại
 * qua `localStorage` (kênh duy nhất mà các tab cùng origin nói chuyện được qua event `storage`).
 * Hỏi/đáp xong là xoá ngay.
 *
 * Giá trị đi qua đây là ĐÚNG chuỗi đã mã hoá vẫn nằm trong storage từ trước, không phải token
 * thô — nên mức rò không cao hơn hiện trạng cũ (cũ nằm thẳng trong localStorage, nay chỉ đi
 * qua trong < 1 giây). Vẫn gắn mốc thời gian và dọn mọi bản ghi quá hạn, để một tab chết giữa
 * đường không bỏ sót chuỗi đó trong localStorage.
 */

const REQUEST_KEY = 'vh-session-request'
const RESPONSE_KEY = 'vh-session-response'

/** Chờ tab khác đáp. Đủ cho event `storage` đi một vòng, chưa đủ lâu để người dùng thấy chậm. */
const WAIT_MS = 300

/** Bản ghi cũ hơn mức này coi như rác (tab đã chết giữa lúc bàn giao) và bị xoá. */
const STALE_MS = 5_000

type Envelope = { at: number; value: string | null }

function ls(): Storage | null {
	if (typeof window === 'undefined') return null
	try {
		return window.localStorage
	} catch {
		return null
	}
}

function readEnvelope(key: string): Envelope | null {
	try {
		const raw = ls()?.getItem(key)
		if (!raw) return null
		const parsed = JSON.parse(raw) as Envelope
		if (typeof parsed?.at !== 'number') return null
		if (Date.now() - parsed.at > STALE_MS) {
			ls()?.removeItem(key)
			return null
		}
		return parsed
	} catch {
		// JSON rác -> xoá cho sạch, lần sau không vướng nữa.
		try {
			ls()?.removeItem(key)
		} catch {
			/* bỏ qua */
		}
		return null
	}
}

function drop(key: string): void {
	try {
		ls()?.removeItem(key)
	} catch {
		/* bỏ qua */
	}
}

/**
 * Tab nào đang có phiên thì trả lời yêu cầu của tab mới. Gọi một lần khi app khởi động.
 *
 * `getCurrent` đọc giá trị đang nằm trong `sessionStorage` của tab này — truyền hàm vào thay vì
 * giá trị, để luôn lấy bản mới nhất tại thời điểm được hỏi.
 */
export function serveSessionToNewTabs(getCurrent: () => string | null): void {
	if (typeof window === 'undefined') return

	// Dọn rác còn lại từ lần chạy trước (tab chết giữa lúc bàn giao).
	readEnvelope(REQUEST_KEY)
	readEnvelope(RESPONSE_KEY)

	window.addEventListener('storage', (event) => {
		if (event.key !== REQUEST_KEY || !event.newValue) return

		const current = getCurrent()
		if (!current) return // Tab này cũng không có phiên -> im lặng, để tab khác đáp.

		try {
			ls()?.setItem(RESPONSE_KEY, JSON.stringify({ at: Date.now(), value: current } satisfies Envelope))
		} catch {
			/* bỏ qua */
		}
	})
}

/**
 * Tab mới xin phiên từ các tab đang mở. Trả về chuỗi đã mã hoá, hoặc `null` nếu không tab nào đáp.
 */
export async function requestSessionFromOtherTabs(): Promise<string | null> {
	if (typeof window === 'undefined') return null

	drop(RESPONSE_KEY)
	try {
		ls()?.setItem(REQUEST_KEY, JSON.stringify({ at: Date.now(), value: null } satisfies Envelope))
	} catch {
		return null
	}

	const value = await new Promise<string | null>((resolve) => {
		const timer = window.setTimeout(() => {
			window.removeEventListener('storage', onStorage)
			// Có thể tab khác đã ghi trước khi listener kịp gắn -> đọc thẳng một lần nữa.
			resolve(readEnvelope(RESPONSE_KEY)?.value ?? null)
		}, WAIT_MS)

		function onStorage(event: StorageEvent) {
			if (event.key !== RESPONSE_KEY || !event.newValue) return
			window.clearTimeout(timer)
			window.removeEventListener('storage', onStorage)
			resolve(readEnvelope(RESPONSE_KEY)?.value ?? null)
		}

		window.addEventListener('storage', onStorage)
	})

	// Xoá ngay: không để chuỗi phiên nằm lại trong localStorage.
	drop(REQUEST_KEY)
	drop(RESPONSE_KEY)

	return value
}
