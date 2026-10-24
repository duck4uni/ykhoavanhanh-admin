/**
 * Làm sạch HTML trước khi đưa vào `dangerouslySetInnerHTML`.
 *
 * VÌ SAO CẦN: các form Phòng khám / Bác sĩ / Chuyên khoa / Dịch vụ có khối xem trước render
 * `visit_instruction`, `description`, `room_visit_instruction` bằng `dangerouslySetInnerHTML`.
 * Mấy field đó KHÔNG phải do người đang xem tự gõ — chúng đến từ API (`room.visit_instruction`,
 * `doctor.description`, ...), tức là ai sửa được bản ghi (hoặc ghi thẳng vào DB, hoặc qua đường
 * đồng bộ HIS) là chèn được `<img onerror=...>` / `<script>` và nó chạy trong phiên của
 * NGƯỜI KHÁC khi họ mở form sửa. Đây là stored XSS, không phải self-XSS — mà portal này có
 * accessToken trong localStorage nên script chạy được là lấy được token.
 *
 * CÁCH LÀM: allowlist (chỉ cho qua thứ đã liệt kê), không phải blocklist. Blocklist kiểu
 * "xoá chữ <script>" luôn bị vượt (`<scr\u0000ipt>`, `<svg onload>`, `javascript:`...).
 *
 * Chạy được cả trên server (Next render HTML trước) lẫn trên client: nhánh client dùng
 * DOMParser (đúng cách parse của browser, không tự viết regex HTML); nhánh server không có DOM
 * nên dùng regex THẮT CHẶT (giữ lại ít thẻ hơn, thà mất định dạng chứ không để lọt script).
 * Hai nhánh cùng input phải ra cùng output ở trường hợp HTML lành — nên khối xem trước chỉ
 * render sau khi mount (xem `RichTextContent`) để không lệch hydration.
 */

/** Thẻ được giữ lại — chỉ thẻ định dạng/bố cục mà TipTap sinh ra. Không có `script`, `iframe`,
 *  `object`, `embed`, `form`, `input`, `style`, `svg`, `math` (đều là đường chạy JS). */
const ALLOWED_TAGS = new Set([
	'p', 'br', 'hr', 'div', 'span',
	'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
	'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'sub', 'sup', 'mark', 'small',
	'ul', 'ol', 'li',
	'blockquote', 'pre', 'code',
	'a', 'img',
	'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
]);

/** Attribute được giữ lại cho mọi thẻ. KHÔNG có `style` (cho phép `style` là mở lại đường
 *  `background:url(...)` và các thủ thuật CSS khác) và tất nhiên không có `on*`. */
const GLOBAL_ATTRS = new Set(['class', 'dir', 'lang', 'title']);

/** Attribute riêng theo thẻ. */
const TAG_ATTRS: Record<string, Set<string>> = {
	a: new Set(['href', 'target', 'rel']),
	img: new Set(['src', 'alt', 'width', 'height', 'loading']),
	td: new Set(['colspan', 'rowspan']),
	th: new Set(['colspan', 'rowspan', 'scope']),
	col: new Set(['span']),
	colgroup: new Set(['span']),
	ol: new Set(['start', 'type']),
};

/**
 * `href`/`src` chỉ cho phép scheme vô hại. Chặn `javascript:`, `data:` (data:text/html chạy
 * script được), `vbscript:`, `file:`. So sánh sau khi bỏ khoảng trắng + ký tự điều khiển vì
 * `java\tscript:` vẫn được browser hiểu là `javascript:`.
 */
function isSafeUrl(value: string): boolean {
	// eslint-disable-next-line no-control-regex
	const cleaned = value.replace(/[\u0000-  ]/g, '').toLowerCase();
	if (cleaned.startsWith('javascript:') || cleaned.startsWith('vbscript:') || cleaned.startsWith('file:')) {
		return false;
	}
	// `data:` chỉ cho ảnh (TipTap có dán ảnh base64), không cho data:text/html.
	if (cleaned.startsWith('data:')) return /^data:image\/(png|jpe?g|gif|webp|avif);base64,/.test(cleaned);
	return true;
}

function sanitizeElement(el: Element): void {
	for (const attr of Array.from(el.attributes)) {
		const name = attr.name.toLowerCase();
		const tag = el.tagName.toLowerCase();
		const allowed = GLOBAL_ATTRS.has(name) || TAG_ATTRS[tag]?.has(name);
		// `on*` bị bắt bởi allowlist rồi, nhưng check tường minh để ý định rõ ràng khi đọc code.
		if (!allowed || name.startsWith('on')) {
			el.removeAttribute(attr.name);
			continue;
		}
		if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value)) {
			el.removeAttribute(attr.name);
		}
	}
	// Link mở tab mới phải có rel=noopener: không có thì trang đích với tới `window.opener`.
	if (el.tagName.toLowerCase() === 'a' && el.getAttribute('target')) {
		el.setAttribute('rel', 'noopener noreferrer');
	}
}

function walk(node: Node): void {
	for (const child of Array.from(node.childNodes)) {
		if (child.nodeType === 3 /* text */) continue;
		if (child.nodeType !== 1 /* element */) {
			// Comment / CDATA / processing instruction: không cần hiển thị, bỏ luôn.
			child.parentNode?.removeChild(child);
			continue;
		}
		const el = child as Element;
		if (!ALLOWED_TAGS.has(el.tagName.toLowerCase())) {
			// Thẻ không cho phép thì BỎ THẺ nhưng giữ phần text bên trong — trừ những thẻ mà nội
			// dung bên trong chính là mã (script/style): ở đó phải xoá cả nội dung, không thì
			// `<script>alert(1)</script>` biến thành text "alert(1)" hiển thị ra trang.
			const tag = el.tagName.toLowerCase();
			if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'template') {
				el.parentNode?.removeChild(el);
				continue;
			}
			walk(el);
			const parent = el.parentNode;
			while (el.firstChild) parent?.insertBefore(el.firstChild, el);
			parent?.removeChild(el);
			continue;
		}
		sanitizeElement(el);
		walk(el);
	}
}

/**
 * Nhánh server (không có DOM). Thắt chặt hơn nhánh client: bỏ hẳn nội dung các thẻ chạy mã,
 * rồi xoá mọi thẻ không có trong allowlist cùng toàn bộ attribute (giữ attribute ở server đòi
 * phải tự parse attribute — dễ sai, và khối xem trước chỉ hiện ở client nên không mất gì).
 */
function sanitizeWithoutDom(html: string): string {
	return html
		.replace(/<(script|style|noscript|template|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag: string) =>
			ALLOWED_TAGS.has(tag.toLowerCase()) ? (match.startsWith('</') ? `</${tag}>` : `<${tag}>`) : '',
		);
}

/** Trả về HTML đã làm sạch, an toàn để đưa vào `dangerouslySetInnerHTML`. */
export function sanitizeHtml(html: string | null | undefined): string {
	if (!html) return '';
	if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
		return sanitizeWithoutDom(html);
	}
	try {
		const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
		walk(doc.body);
		return doc.body.innerHTML;
	} catch {
		// Parse lỗi thì KHÔNG trả về HTML gốc (fail-open = vẫn XSS) — rơi về nhánh thắt chặt.
		return sanitizeWithoutDom(html);
	}
}
