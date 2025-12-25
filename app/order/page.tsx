"use client";

import { useSearchParams } from "next/navigation";
import MenuPage from "./MenuPage";

export default function OrderPage() {
  const params = useSearchParams();
  const table = params.get("table");

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto p-4">
        <div className="mb-4">
          <div className="text-lg font-bold text-black">Món ngon nóng hổi</div>
          <div className="text-sm text-gray-600">Giao tận bàn {table}</div>
        </div>

        <MenuPage />
      </div>
    </main>
  );
}
