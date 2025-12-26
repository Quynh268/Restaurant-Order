"use client";

type Tab = "pending" | "confirmed" | "await_payment" | "done";

export default function OrdersHeader({
  activeTab,
  counts,
  onChange,
}: {
  activeTab: Tab;
  counts: Record<Tab, number>;
  onChange: (t: Tab) => void;
}) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: "Chờ xác nhận" },
    { key: "confirmed", label: "Đang làm" },
    { key: "await_payment", label: "Chờ thanh toán" },
    { key: "done", label: "Hoàn thành" },
  ];

  return (
    <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              Quản Lý Đơn Hàng
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Hệ thống điều hành quán
            </p>
          </div>

          <div className="flex p-1 bg-gray-100 rounded-lg overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => onChange(t.key)}
                className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2
                  ${
                    activeTab === t.key
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {t.label}
                {/* Luôn hiển thị badge nếu số lượng > 0 */}
                {counts[t.key] > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      t.key === "pending"
                        ? "bg-red-500 text-white" // Đỏ cho tab quan trọng
                        : "bg-gray-200 text-gray-700" // Xám cho các tab khác
                    }`}
                  >
                    {counts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
