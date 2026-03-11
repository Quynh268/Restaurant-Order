"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // Chú ý đường dẫn này nếu của bạn khác nhé

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // --- BẢO MẬT: STATE KIỂM TRA ĐĂNG NHẬP ---
  const [isChecking, setIsChecking] = useState(true);

  // --- LOGIC KIỂM TRA QUYỀN TRUY CẬP ---
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      
      // Nếu KHÔNG CÓ phiên đăng nhập
      if (!data.session) {
        router.replace("/login"); // Đá ra trang login
      } else {
        setIsChecking(false); // Có phiên đăng nhập -> Tắt màn hình chờ, cho phép vào
      }
    };

    checkUser();
  }, [router]);

  const menuItems = [
    { name: "Danh sách món", href: "/admin/menu", icon: "🍔" },
    { name: "Loại món", href: "/admin/categories", icon: "🏷️" },
    { name: "Khu vực bàn", href: "/admin/areas", icon: "📍" },
    { name: "Sơ đồ bàn", href: "/admin/tables", icon: "🪑" },
    {
      name: "Về trang Đơn hàng",
      href: "/admin/orders",
      icon: "⬅️",
      special: true,
    },
  ];

  // --- HIỂN THỊ MÀN HÌNH CHỜ TRONG LÚC SUPABASE KIỂM TRA ---
  // (Tránh hiện giao diện Admin lên 1 giây rồi mới văng ra login)
  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-500 font-medium">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  // --- GIAO DIỆN ADMIN KHI ĐÃ ĐĂNG NHẬP THÀNH CÔNG ---
  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* SIDEBAR CỐ ĐỊNH */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-800">
            <span className="text-orange-600">Admin</span> Panel
          </h1>
          <p className="text-xs text-gray-400 mt-1">Dành cho chủ quán</p>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all mb-1
                  ${
                    item.special
                      ? "bg-gray-800 text-white mt-10 hover:bg-gray-700"
                      : isActive
                      ? "bg-orange-50 text-orange-600 shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* NỘI DUNG CHÍNH (Thay đổi theo trang) */}
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}