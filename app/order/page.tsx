"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MenuPage from "./MenuPage";

function OrderContent() {
  const params = useSearchParams();
  const table = params.get("table");

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-4">
        <div className="text-lg font-bold text-black">Món ngon nóng hổi</div>
        <div className="text-sm text-gray-600">
          {table ? `Giao tận bàn ${table}` : "Vui lòng chọn bàn"}
        </div>
      </div>
      <MenuPage />
    </div>
  );
}

export default function OrderPage() {
  return (
    <main className="bg-gray-50 min-h-screen">
      <Suspense
        fallback={
          <div className="text-center p-10 font-bold text-gray-500">
            Đang tải thực đơn...
          </div>
        }
      >
        <OrderContent />
      </Suspense>
    </main>
  );
}
