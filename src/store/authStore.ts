// Core
import { isUndefined } from 'lodash-es'
import { create, StateCreator } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// App
import { createStorage } from '@/utils/storage'
import { clearIdleMarker } from '@/utils/idleTimeout'

// Types
import { AdminUser } from '@/types/user'
import { AuthTokenResponse, RefreshTokenResponse } from '@/types/api-response'

// Store name
export const authStoreName = 'vh-auth-store'

// States
export interface AuthStates {
  isSignedIn: boolean
  accessToken: string | null
  refreshToken: string | null
  expiresIn: string | null
  tokenExpiresAt: number | null
  user: AdminUser | null
  isLoading: boolean
}

// Actions
interface AuthActions {
  setAuth: (tokens: AuthTokenResponse, user?: AdminUser) => void
  setUser: (user: AdminUser) => void
  updateAccessToken: (tokens: RefreshTokenResponse) => void
  setLoading: (loading: boolean) => void
  setStore: (values: Partial<AuthStates>) => void
  resetStore: () => void
}

// Store type
type AuthStore = AuthStates & AuthActions

// Initial states
const INITIAL_STATES: AuthStates = {
  isSignedIn: false,
  accessToken: null,
  refreshToken: null,
  expiresIn: null,
  tokenExpiresAt: null,
  user: null,
  isLoading: true
}

// Partial states for persistence (only persist auth-related fields)
type PersistedStates = Pick<AuthStates, 'isSignedIn' | 'accessToken' | 'refreshToken' | 'expiresIn' | 'tokenExpiresAt' | 'user'>

// Define store using StateCreator pattern
const authStore: StateCreator<AuthStore> = (set) => ({
  // States
  ...INITIAL_STATES,

  // Actions
  setAuth: (tokens, user) => {
    const expiresAt = Date.now() + parseInt(tokens.expiresIn, 10) * 1000
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenExpiresAt: expiresAt,
      user: user || null,
      isSignedIn: true,
      isLoading: false
    })
  },

  setUser: (user) => set({ user, isSignedIn: true }),

  updateAccessToken: (tokens) => {
    const expiresAt = Date.now() + parseInt(tokens.expiresIn, 10) * 1000
    set({
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      tokenExpiresAt: expiresAt
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),

  // Partial update using isUndefined (only update provided fields)
  setStore: ({ isSignedIn, accessToken, refreshToken, expiresIn, tokenExpiresAt, user, isLoading }) =>
    set((state) => ({
      isSignedIn: isUndefined(isSignedIn) ? state.isSignedIn : isSignedIn,
      accessToken: isUndefined(accessToken) ? state.accessToken : accessToken,
      refreshToken: isUndefined(refreshToken) ? state.refreshToken : refreshToken,
      expiresIn: isUndefined(expiresIn) ? state.expiresIn : expiresIn,
      tokenExpiresAt: isUndefined(tokenExpiresAt) ? state.tokenExpiresAt : tokenExpiresAt,
      user: isUndefined(user) ? state.user : user,
      isLoading: isUndefined(isLoading) ? state.isLoading : isLoading
    })),

  // Reset to initial state
  resetStore: () =>
    set({
      isSignedIn: INITIAL_STATES.isSignedIn,
      accessToken: INITIAL_STATES.accessToken,
      refreshToken: INITIAL_STATES.refreshToken,
      expiresIn: INITIAL_STATES.expiresIn,
      tokenExpiresAt: INITIAL_STATES.tokenExpiresAt,
      user: INITIAL_STATES.user,
      isLoading: INITIAL_STATES.isLoading
    })
})

/**
 * `devtools` CHỈ bật ở môi trường dev.
 *
 * Middleware này cài hook `__REDUX_DEVTOOLS_EXTENSION__`, nên ở production ai có extension
 * Redux DevTools là xem được accessToken/refreshToken và sửa thẳng state đang chạy. Người đã
 * đăng nhập thì vốn đã có token của chính họ (không rò gì mới), nhưng đây là bề mặt không cần
 * thiết trên máy dùng chung ở quầy — tắt đi thì không mất gì.
 *
 * Lưu ý: tắt cái này KHÔNG phải để "chặn devtools". Không có cách nào chặn được devtools, và
 * sửa state ở client cũng không vượt được backend (xem comment ở middleware.ts).
 */
// Create store with middleware
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(authStore, {
      name: authStoreName,
      storage: createStorage<PersistedStates>(),
      // Only persist auth-related fields
      partialize: (state): PersistedStates => ({
        isSignedIn: state.isSignedIn,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresIn: state.expiresIn,
        tokenExpiresAt: state.tokenExpiresAt,
        user: state.user
      }),
      // Set isLoading to false after rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setLoading(false)
        }
      }
    }),
    { name: authStoreName, enabled: process.env.NODE_ENV === 'development' }
  )
)

// Selector hooks for commonly used values
export const useAccessToken = () => useAuthStore((state) => state.accessToken)
export const useRefreshToken = () => useAuthStore((state) => state.refreshToken)
export const useCurrentUser = () => useAuthStore((state) => state.user)
export const useIsSignedIn = () => useAuthStore((state) => state.isSignedIn)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)

// Re-export from authApi and hooks
export { useGetMyInfo } from "@/api/authApi";
export { useCurrentUserWithSync } from "@/hooks/useCurrentUser";
export const getAccessToken = () => useAuthStore.getState().accessToken

export const isTokenExpired = () => {
  const tokenExpiresAt = useAuthStore.getState().tokenExpiresAt
  if (!tokenExpiresAt) return true
  return Date.now() >= tokenExpiresAt - 30000 // 30 seconds buffer
}

/**
 * Đăng xuất phía client. Dùng bởi `handleLogout()` trong lib/axios.ts khi refresh token thất bại.
 *
 * Phải xoá cả mốc hoạt động: `resetStore()` chỉ ghi state chứ không gọi `removeItem` của tầng
 * persist, nên không xoá là lần đăng nhập sau đọc được mốc cũ và bị đăng xuất ngay.
 */
export const logout = () => {
  useAuthStore.getState().resetStore()
  clearIdleMarker()
}
