"use client";

import { useCart } from "@/app/context/CartContext";

type FloatingCartBarProps = {
  onOpen: () => void;
};

export default function FloatingCartBar({ onOpen }: FloatingCartBarProps) {
  const { totalQuantity, totalPrice } = useCart();

  if (totalQuantity === 0) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50">
      <button
        onClick={onOpen}
        className="w-full bg-gray-900 text-white
                   rounded-xl px-3 py-2
                   flex items-center justify-between
                   shadow-lg active:scale-[0.99]"
      >
        <div className="flex items-center gap-2">
          <div
            className="bg-orange-500 w-7 h-7 rounded-full
                       flex items-center justify-center text-sm font-bold"
          >
            {totalQuantity}
          </div>
          <div className="text-sm">
            <div className="text-gray-300 text-xs">Giỏ hàng của bạn</div>
            <div className="font-semibold">{totalPrice.toLocaleString()}đ</div>
          </div>
        </div>

        <div className="text-orange-400 text-sm font-semibold">Xem →</div>
      </button>
    </div>
  );
}
