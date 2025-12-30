"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import MenuPage from "./MenuPage";
import { CartProvider } from "@/app/context/CartContext";
import FloatingCartBar from "./FloatingCartBar";
import CartSheet from "./CartSheet";

function OrderContent() {
  const params = useSearchParams();
  const table = params.get("table");

  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      <div className="max-w-md mx-auto p-4 pb-28">
        {" "}
        <div className="mb-4">
          <div className="text-lg font-bold text-black">Món ngon nóng hổi</div>
          <div className="text-sm text-gray-600">
            {table ? `Giao tận bàn ${table}` : "Vui lòng chọn bàn"}
          </div>
        </div>
        <MenuPage />
        <FloatingCartBar onOpen={() => setIsCartOpen(true)} />
        <CartSheet open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </CartProvider>
  );
}
export default function OrderPage() {
  return (
    <main className="bg-gray-50 min-h-screen">
      <Suspense
        fallback={
          <div className="text-center p-10 font-bold text-gray-500">
            Đang tải thực đơn cho khách iu...
          </div>
        }
      >
        <OrderContent />
      </Suspense>
    </main>
  );
}
