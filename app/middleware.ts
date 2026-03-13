import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Lấy "thẻ ra vào" (cookie) của người dùng
  const isAuth = request.cookies.get('staff_auth');

  // Nếu đang cố vào khu vực /admin (nhưng không phải trang login)
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    // Nếu chưa có thẻ ra vào -> Đuổi về trang đăng nhập
    if (!isAuth || isAuth.value !== 'true') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Nếu có thẻ rồi thì cho qua
  return NextResponse.next();
}

// Cấu hình để middleware chỉ chạy trên các đường dẫn bắt đầu bằng /admin
export const config = {
  matcher: '/admin/:path*',
};

// Ép Vercel nạp code mới