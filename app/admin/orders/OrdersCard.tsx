"use client";

import { useState } from "react";
import { OrderUI } from "./page";
import EditOrderModal from "./EditOrderModal";

type Props = {
  order: OrderUI;
  onNextStep: () => void;
  onPayment: (method: "CASH" | "CK") => void;
  onDelete: () => void;
  onRefresh?: () => void; // Hàm reload khi save xong
};

export default function OrdersCard({
  order,
  onNextStep,
  onPayment,
  onDelete,
  onRefresh,
}: Props) {
  // State điều khiển mở Modal
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isTakeaway = order.orderType === "TAKEAWAY";

  const handleReprint = () => {
    alert(`🖨️ Đang in lại hóa đơn (Không QR) cho bàn ${order.tableCode}...`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full transition-shadow hover:shadow-md">
      {/* --- HEADER --- */}
      <div className="p-4 border-b border-gray-50 flex justify-between items-start">
        {/* Cột trái: Thông tin đơn & Khách */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-800 text-lg">
              {order.code}
            </span>
            <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
              {new Date(order.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-2">
            KHÁCH: {order.customer_name}
          </div>

          {/* Badge: Mang về / Tại bàn */}
          {isTakeaway ? (
            <span className="inline-block bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded">
              MANG VỀ
            </span>
          ) : (
            <span className="inline-block bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded">
              DÙNG TẠI BÀN
            </span>
          )}
        </div>

        {/* Cột phải: Bàn & Thanh toán */}
        <div className="text-right flex flex-col items-end">
          <div className="text-orange-600 font-black text-3xl leading-none">
            {order.tableCode}
          </div>
          <div className="text-[10px] font-bold text-gray-300 uppercase mt-1">
            BÀN
          </div>

          {/* --- VỊ TRÍ MỚI CHO BADGE THANH TOÁN (Chỉ hiện khi HOÀN THÀNH) --- */}
          {order.status === "DONE" && (
            <div className="mt-2">
              {order.paymentMethod === "CASH" && (
                <span className="inline-block bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded border border-yellow-200">
                  TIỀN MẶT
                </span>
              )}
              {order.paymentMethod === "CK" && (
                <span className="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded border border-green-200">
                  CHUYỂN KHOẢN
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- BODY: LIST MÓN --- */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[200px]">
        {order.items.map((i, idx) => (
          <div
            key={idx}
            className="flex justify-between items-start text-sm group"
          >
            <div className="flex gap-3">
              <span className="font-bold text-gray-900 min-w-[1.5rem]">
                {i.quantity}
              </span>
              <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
                {i.food_name}
              </span>
            </div>
            <span className="text-gray-900 font-semibold ml-2">
              {(i.price * i.quantity).toLocaleString()}đ
            </span>
          </div>
        ))}
      </div>

      {/* --- FOOTER: TỔNG TIỀN & NÚT BẤM --- */}
      <div className="p-4 bg-gray-50/50 border-t border-gray-100 mt-auto">
        <div className="flex justify-between items-end mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase pb-1">
            TỔNG TIỀN
          </span>
          <span className="text-xl font-black text-gray-900">
            {order.total_amount.toLocaleString()}đ
          </span>
        </div>

        <div className="space-y-2">
          {/* PENDING */}
          {order.status === "PENDING" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-50 transition"
                  onClick={() => setIsEditOpen(true)}
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={onNextStep}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm shadow-blue-200 hover:bg-blue-700 transition"
                >
                  Xác nhận
                </button>
              </div>
              <button
                onClick={onDelete}
                className="w-full bg-red-50 text-red-500 py-2.5 rounded-lg font-bold text-sm hover:bg-red-100 transition"
              >
                Hủy đơn
              </button>
            </>
          )}

          {/* CONFIRMED */}
          {order.status === "CONFIRMED" && (
            <button
              onClick={onNextStep}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm shadow-sm shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <span>🔔</span> Đã lên món xong
            </button>
          )}

          {/* AWAIT_PAYMENT */}
          {order.status === "AWAIT_PAYMENT" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onPayment("CASH")}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm shadow-green-200 hover:bg-green-700 transition flex flex-col items-center justify-center leading-tight"
              >
                <span>💵 Tiền mặt</span>
                <span className="text-[9px] opacity-80 font-normal">
                  In thường
                </span>
              </button>
              <button
                onClick={() => onPayment("CK")}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm shadow-blue-200 hover:bg-blue-700 transition flex flex-col items-center justify-center leading-tight"
              >
                <span>💳 Chuyển khoản</span>
                <span className="text-[9px] opacity-80 font-normal">
                  In kèm QR
                </span>
              </button>
            </div>
          )}

          {/* DONE - Chỉ còn nút in lại, badge đã chuyển lên header */}
          {order.status === "DONE" && (
            <button
              onClick={handleReprint}
              className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-50 transition"
            >
              🖨️ In lại hóa đơn
            </button>
          )}
        </div>
      </div>
      {isEditOpen && (
        <EditOrderModal
          order={order}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={() => {
            if (onRefresh) onRefresh(); // Reload list đơn
          }}
        />
      )}
    </div>
  );
}
