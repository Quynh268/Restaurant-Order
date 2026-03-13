"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Trình duyệt tự đọc mã bàn trên thanh địa chỉ
    const table = searchParams.get("table");
    
    if (table) {
      // Bắt được mã bàn -> Đá thẳng vào trang Order của bàn đó
      router.replace(`/order?table=${table}`);
    } else {
      // Nếu khách tự gõ mỗi tên miền quán -> Cho về A01 làm mặc định
      router.replace("/order?table=A01");
    }
  }, [router, searchParams]);

  // Hiện màn hình loading trong tích tắc lúc đang chuyển hướng
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-bold">Đang đưa khách vào bàn...</p>
    </div>
  );
}

export default function Home() {
  // Suspense là bắt buộc khi dùng useSearchParams trong Next.js để không bị lỗi Build
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"></div>}>
      <RedirectLogic />
    </Suspense>
  );
}