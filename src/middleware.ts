import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/utils/authCookie';

/**
 * Chặn sớm người gõ thẳng URL khi chưa đăng nhập.
 *
 * TRƯỚC ĐÓ: không có middleware, guard duy nhất là `useEffect` trong `(dashboard)/layout.tsx` —
 * chạy SAU khi HTML đã về browser. Gõ `/patients` thì server trả HTTP 200, người dùng thấy
 * spinner rồi mới bị đẩy về login. Không rò dữ liệu (mọi trang là client component, fetch kèm
 * Bearer token, không token thì backend trả 401) nhưng trải nghiệm xấu và lộ cấu trúc route.
 *
 * ĐÂY KHÔNG PHẢI RANH GIỚI BẢO MẬT — và không thể là. Middleware chỉ đọc được cookie, mà cookie
 * tín hiệu `vh-signed-in` do client ghi nên giả được (ghi `document.cookie` là xong). Người giả
 * cookie sẽ vào được KHUNG trang, nhưng không có accessToken hợp lệ nên mọi request dữ liệu đều
 * 401/403 — họ chỉ thấy trang rỗng.
 *
 * Ranh giới thật là backend: `verify` (JWT) -> `requirePermission` -> quyền đọc tươi từ DB mỗi
 * request. Muốn FE thành ranh giới thật thì phải chuyển token sang cookie `httpOnly` do backend
 * set — việc đó đụng cả `/auth/login` và app mobile, nên là một quyết định riêng.
 */

/** Đường dẫn khách chưa đăng nhập được vào. */
const PUBLIC_PREFIXES = ['/auth'];

function isPublic(pathname: string): boolean {
	return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(req: NextRequest) {
	const { pathname, search } = req.nextUrl;
	const isSignedIn = req.cookies.get(AUTH_COOKIE_NAME)?.value === '1';

	// Đã đăng nhập mà mở lại trang login -> về trang chủ, không cho thấy form đăng nhập nữa.
	if (isSignedIn && pathname.startsWith('/auth/login')) {
		return NextResponse.redirect(new URL('/', req.url));
	}

	if (isPublic(pathname) || isSignedIn) return NextResponse.next();

	// Giữ lại đường dẫn gốc để đăng nhập xong quay về đúng trang họ muốn vào, thay vì luôn về `/`.
	const loginUrl = new URL('/auth/login', req.url);
	loginUrl.searchParams.set('next', `${pathname}${search}`);
	return NextResponse.redirect(loginUrl);
}

export const config = {
	/**
	 * Bỏ qua tài nguyên tĩnh và file ở public/. KHÔNG chặn `_next/*`: chặn vào đó là trang
	 * login cũng không tải nổi JS/CSS của chính nó.
	 */
	matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf)$).*)'],
};
