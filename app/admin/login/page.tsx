"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ĐẶT MÃ PIN CỦA QUÁN
    if (pin === "123456") {
      // Set cookie có hạn 1 ngày (86400 giây)
      document.cookie = "staff_auth=true; path=/; max-age=86400";
      router.push("/admin/orders"); // Đẩy vào trang quản lý
      router.refresh();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Khu vực Nhân viên</h1>
        <p className="text-sm text-gray-500 mb-8">Vui lòng nhập mã PIN để truy cập</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="••••••"
              className="w-full text-center text-3xl tracking-[1em] font-bold border-b-2 border-gray-200 focus:border-orange-500 focus:outline-none py-2 transition-colors"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-3 font-medium">Mã PIN không chính xác!</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl transition-transform active:scale-95"
          >
            ĐĂNG NHẬP
          </button>
        </form>
      </div>
    </div>
  );
}