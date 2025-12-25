"use client";

import { useState } from "react";
import { useCart } from "@/app/context/CartContext";

/* ================== TYPES ================== */
enum OrderType {
  DINE_IN = "DINE_IN",
  TAKEAWAY = "TAKEAWAY",
}

type Props = {
  open: boolean;
  onClose: () => void;
};

/* ================== COMPONENT ================== */
export default function CartSheet({ open, onClose }: Props) {
  const { items, totalPrice, increase, decrease } = useCart();
  const { addItem } = useCart();

  const [orderType, setOrderType] = useState<OrderType>(OrderType.DINE_IN);
  const [tableNumber, setTableNumber] = useState("B01");
  const [note, setNote] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] max-h-[95vh] flex flex-col animate-slide-up">
        {/* handle */}
        <div className="w-14 h-1.5 bg-gray-200 rounded-full mx-auto mt-3" />

        {/* header */}
        <div className="px-6 py-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn</h2>
            <p className="text-xs text-gray-500 mt-1">
              Cửa hàng đang chờ bạn gửi đơn
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-gray-100 text-gray-500 text-xl"
          >
            ✕
          </button>
        </div>

        {/* items */}
        <div className="px-6 space-y-5 overflow-y-auto">
          {items.map((i) => (
            <div key={i.foodId} className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-200" />

              <div className="flex-1">
                <div className="font-semibold text-gray-900">{i.name}</div>
                <div className="text-orange-600 font-bold">
                  {(i.price * i.quantity).toLocaleString()}đ
                </div>
              </div>

              <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
                <button
                  onClick={() => decrease(i.foodId)}
                  className="w-8 h-8 flex items-center justify-center 
               text-gray-600 text-xl font-bold"
                >
                  −
                </button>

                <span className="w-8 text-center text-gray-900 font-bold text-lg">
                  {i.quantity}
                </span>

                <button
                  onClick={() => increase(i.foodId)}
                  className="w-8 h-8 flex items-center justify-center 
               text-gray-600 text-xl font-bold"
                ></button>
              </div>
            </div>
          ))}

          {/* order type */}
          <div className="pt-6">
            <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Bạn muốn nhận món tại đâu?
            </div>

            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setOrderType(OrderType.DINE_IN)}
                className={`flex-1 py-3 rounded-full text-sm font-semibold transition
      ${
        orderType === OrderType.DINE_IN
          ? "bg-white text-orange-600 shadow"
          : "text-gray-500"
      }`}
              >
                🍽 Dùng tại bàn
              </button>

              <button
                onClick={() => setOrderType(OrderType.TAKEAWAY)}
                className={`flex-1 py-3 rounded-full text-sm font-semibold transition
      ${
        orderType === OrderType.TAKEAWAY
          ? "bg-white text-orange-600 shadow"
          : "text-gray-500"
      }`}
              >
                🛍 Mang về
              </button>
            </div>
          </div>

          {/* inputs */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Số bàn
            </label>
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="VD: B01"
              className="w-full mt-2
                          rounded-2xl px-5 py-4
                          text-lg font-semibold text-gray-900
                          bg-gray-50
                          focus:outline-none focus:ring-4 focus:ring-orange-100
                          transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              Ghi chú đặc biệt
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ít cay, không lấy mắm tôm..."
              className="w-full mt-2 bg-gray-50 rounded-2xl p-4 font-semibold focus:ring-4 focus:ring-orange-100 resize-none h-24"
            />
          </div>
        </div>

        {/* footer */}
        <div className="px-6 py-6 border-t mt-6">
          <div className="flex justify-between mb-4">
            <span className="text-gray-400 font-bold uppercase text-xs">
              Tổng cộng
            </span>
            <span className="text-2xl font-bold text-orange-600">
              {totalPrice.toLocaleString()}đ
            </span>
          </div>

          <button className="w-full py-5 rounded-[2rem] bg-orange-600 text-white font-black text-xl shadow-lg active:scale-95 transition">
            🚀 Gửi đơn ngay
          </button>
        </div>
      </div>
    </div>
  );
}
