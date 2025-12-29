"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
                      ? "bg-gray-800 text-white mt-10 hover:bg-gray-700" // Nút về trang đơn hàng màu đen
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
