"use client";

import { supabase } from "@/lib/supabaseClient";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import MenuPage from "./MenuPage";
import FloatingCartBar from "./FloatingCartBar";
import CartSheet from "./CartSheet";

function OrderContent() {
  const params = useSearchParams();
  const table = params.get("table");

  const [isCartOpen, setIsCartOpen] = useState(false);

  // --- STATE BẢO VỆ KHU VỰC ---
  // Khởi tạo isChecking thông minh: Có mã bàn mới cần check (true), không có mã bàn thì không cần check (false)
  const [isChecking, setIsChecking] = useState(!!table); 
  const [isValidTable, setIsValidTable] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!table) {
      return; 
    }

    async function checkTableStatus() {
      setIsChecking(true); // Bắt đầu check

      // Gọi Supabase lấy thông tin Bàn + trạng thái is_active của Khu Vực
      const { data, error } = await supabase
        .from("tables")
        .select("*, areas(is_active, name)")
        .eq("code", table)
        .single();

      if (error || !data) {
        // Bàn không tồn tại (Khách quét mã bậy bạ hoặc tự gõ sai)
        setIsValidTable(false);
        setErrorMessage("Mã bàn này không tồn tại trong hệ thống!");
      } else if (data.areas?.is_active === false) {
        // Bàn có tồn tại nhưng Khu Vực đang bị chủ quán TẮT
        setIsValidTable(false);
        setErrorMessage(`Khu vực ${data.areas.name} hiện đang đóng cửa. Vui lòng liên hệ nhân viên!`);
      } else {
        // Mọi thứ hoàn hảo, cho phép gọi món
        setIsValidTable(true);
      }
      
      setIsChecking(false); // Kết thúc check
    }

    checkTableStatus();
  }, [table]);

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold">Đang kiểm tra bàn...</p>
      </div>
    );
  }

  if (!isValidTable) {
    return (
      <div className="max-w-md mx-auto p-8 mt-10 bg-white rounded-3xl shadow-lg text-center border border-red-100">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-black text-red-600 mb-2">Chưa thể gọi món!</h2>
        <p className="text-gray-600 font-medium leading-relaxed">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-4">
        <div className="text-lg font-bold text-black">Món ngon nóng hổi</div>
        <div className="text-sm text-gray-600">
          {table
            ? `Giao tận bàn ${table} cho khách iu`
            : "Khách iu vui lòng chọn đúng bàn"}
        </div>
      </div>
      
      {/* Menu và Giỏ hàng chỉ được render khi bảng isValidTable là true */}
      <MenuPage />
      <FloatingCartBar onOpen={() => setIsCartOpen(true)} />
      <CartSheet open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}

export default function OrderPage() {
  return (
    <main className="bg-gray-50 min-h-screen">
      <Suspense
        fallback={
          <div className="text-center p-10 font-bold text-gray-500">
            Đang tải dữ liệu cho khách iu...
          </div>
        }
      >
        <OrderContent />
      </Suspense>
    </main>
  );
}