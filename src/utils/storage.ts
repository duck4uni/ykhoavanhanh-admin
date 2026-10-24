// Core
import { decrypt, encrypt } from './crypto'
import { PersistStorage, StorageValue } from 'zustand/middleware'
// import { getCookie, removeCookie, setCookie } from 'typescript-cookie'
// App
import envConfig from './env-config'
import { syncAuthCookie } from './authCookie'
import { clearIdleMarker } from './idleTimeout'
import { requestSessionFromOtherTabs, serveSessionToNewTabs } from './sessionHandoff'

/**
 * Phiên lưu ở `sessionStorage`, KHÔNG phải `localStorage`.
 *
 * VÌ SAO ĐỔI: `localStorage` sống qua cả lần đóng browser, nên ở máy dùng chung tại quầy tiếp
 * tân, người ngồi sau mở lại trình duyệt là vào thẳng phiên của người trước — không cần kỹ
 * năng gì, không cần devtools. `sessionStorage` mất khi đóng cửa sổ cuối cùng, nên phiên không
 * sống lâu hơn lần ngồi làm việc. Đi kèm cơ chế tự đăng xuất sau 30 phút không hoạt động
 * (idleTimeout.ts) cho trường hợp bỏ máy mà không đóng browser.
 *
 * ĐÁNH ĐỔI: `sessionStorage` riêng từng tab, nên mở ra tab mới sẽ mất phiên. Xử lý bằng
 * `sessionHandoff.ts` — tab mới xin phiên từ tab đang mở. Xem lý do chi tiết ở file đó.
 */

/** Khớp với `authStoreName` trong store/authStore.ts (không import để khỏi vòng phụ thuộc). */
const AUTH_STORAGE_NAME = 'vh-auth-store'

function sessionStore(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    // Cửa sổ riêng tư / chặn site data.
    return null
  }
}

function localRead(name: string): string | null {
  try {
    return window.localStorage.getItem(name)
  } catch {
    return null
  }
}

function localDrop(name: string): void {
  try {
    window.localStorage.removeItem(name)
  } catch {
    /* bỏ qua */
  }
}

/** Tab này đáp lại tab mới mở — đăng ký ngay khi module được nạp. */
serveSessionToNewTabs(() => {
  try {
    return sessionStore()?.getItem(AUTH_STORAGE_NAME) ?? null
  } catch {
    return null
  }
})

export async function getItem(name: string) {
  const store = sessionStore()
  let cipherText = store?.getItem(name) ?? null

  // Chuyển tiếp từ bản cũ: máy nào đang chạy bản trước có phiên nằm trong `localStorage`. Nhận
  // một lần rồi XOÁ — để không còn bản ghi nào sống qua lần đóng browser, và để nhân viên đang
  // đăng nhập không bị đá ra ngay lúc deploy.
  if (!cipherText) {
    const legacy = localRead(name)
    if (legacy) {
      cipherText = legacy
      localDrop(name)
      try {
        store?.setItem(name, legacy)
      } catch {
        /* bỏ qua */
      }
    }
  }

  // Tab này chưa có phiên (vừa mở tab mới / nhân bản tab) nhưng browser vẫn còn phiên ở tab
  // khác -> xin lại. Không có bước này thì cookie `vh-signed-in` (dùng chung giữa các tab) và
  // sessionStorage (riêng tab) lệch nhau, gây vòng lặp login <-> trang chủ.
  if (!cipherText) {
    cipherText = await requestSessionFromOtherTabs()
    if (cipherText) {
      try {
        store?.setItem(name, cipherText)
      } catch {
        /* bỏ qua */
      }
    }
  }

  if (!cipherText) {
    // Không còn phiên ở đâu -> xoá cookie, nếu không middleware vẫn tưởng đang đăng nhập và
    // đẩy người dùng vào trang rỗng.
    syncAuthCookie(false)
    return null
  }

  const originalText = await decrypt(cipherText, envConfig.SECRET_KEY, envConfig.BUFFER_KEY)
  if (!originalText) {
    syncAuthCookie(false)
    return null
  }

  const parsed = JSON.parse(originalText)
  // Đồng bộ cookie cho middleware (server không đọc được sessionStorage).
  syncAuthCookie(parsed?.state?.isSignedIn === true)
  return parsed
}

export async function setItem<S>(name: string, value: StorageValue<S>) {
  const cipherText = await encrypt(JSON.stringify(value), envConfig.SECRET_KEY, envConfig.BUFFER_KEY)
  try {
    sessionStore()?.setItem(name, cipherText)
  } catch {
    /* bỏ qua */
  }

  // Đồng bộ cookie cho `middleware.ts`. Đặt ở đây — tầng persist — để MỌI đường đăng nhập/đăng
  // xuất đều đi qua, không phải nhớ gọi ở từng nơi.
  //
  // CỐ Ý KHÔNG gọi `markActivity()` ở đây. Hàm này chạy mỗi lần zustand ghi state — gồm cả
  // `setLoading(false)` lúc rehydrate (mỗi lần F5) và `setUser` từ `useGetMyInfo` (chạy nền).
  // Đặt ở đây là đồng hồ 30 phút bị reset bởi request nền và bởi F5, tức không bao giờ hết giờ.
  // Mốc hoạt động chỉ do hành động thật của người dùng đặt (useIdleLogout) và do lúc đăng nhập
  // (authApi.login).
  syncAuthCookie((value as { state?: { isSignedIn?: boolean } })?.state?.isSignedIn === true)
}

export async function removeItem(name: string) {
  try {
    sessionStore()?.removeItem(name)
  } catch {
    /* bỏ qua */
  }
  localDrop(name) // Dọn cả bản ghi của phiên bản cũ.
  syncAuthCookie(false)
  clearIdleMarker()
}

// Utils
// Create storage
export const createStorage = <S>(): PersistStorage<S> => {
  return {
    getItem,
    setItem,
    removeItem
  }
}
