"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { supabase } from "@/lib/supabaseClient";

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
  const { items, totalPrice, increase, decrease, removeItem, clearCart } =
    useCart();

  // Lấy tham số từ URL (ví dụ: ?table=B01)
  const searchParams = useSearchParams();
  const tableFromUrl = searchParams.get("table") || "";

  const [orderType, setOrderType] = useState<OrderType>(OrderType.DINE_IN);
  const [tableNumber, setTableNumber] = useState(tableFromUrl);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");

  // State điều khiển hiệu ứng
  const [isClosing, setIsClosing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // State loading khi đang gửi
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cập nhật lại số bàn nếu URL thay đổi (trường hợp navigate mà không reload)
  useEffect(() => {
    if (tableFromUrl) {
      setTableNumber(tableFromUrl);
    }
  }, [tableFromUrl]);

  // LOGIC TỰ ĐỘNG ĐÓNG (0.5s)
  useEffect(() => {
    if (open && items.length === 0) {
      setShowToast(true);

      const closeTimer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
          setIsClosing(false);
          setShowToast(false);
        }, 300);
      }, 500);

      return () => clearTimeout(closeTimer);
    }
  }, [items.length, open, onClose]);

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    if (!tableNumber) {
      alert("Vui lòng nhập số bàn hoặc quét mã QR!");
      return;
    }

    setIsSubmitting(true);

    try {
      // Tìm ID bàn
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("id")
        .eq("code", tableNumber) // B01 B02 ...
        .single();

      if (tableError || !tableData) {
        throw new Error(`Không tìm thấy bàn ${tableNumber}`);
      }

      // Tạo record trong 'orders'
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          table_id: tableData.id,
          status: "PENDING", // Trạng thái chờ
          total_amount: totalPrice,
          customer_name: customerName,
          note: note,
          order_type: orderType,
          // created_at tự động sinh
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Chi tiết món
      const orderItemsData = items.map((item) => ({
        order_id: orderData.id,
        food_id: item.foodId,
        quantity: item.quantity,
        price: item.price, // Lưu giá tại thời điểm gọi
        food_name: item.name, // Lưu tên món tại thời điểm gọi
      }));

      // Lưu chi tiết món vô 'order_items'
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // Thành công -> Xóa giỏ hàng & Đóng popup
      alert("Đặt món thành công! Bếp đang chuẩn bị.");
      clearCart();
    } catch (error: any) {
      console.error("Lỗi đặt món:", error);
      alert("Có lỗi xảy ra: " + (error.message || error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const labelStyle =
    "text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block";
  const inputStyle =
    "w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-100 transition placeholder:text-gray-400";

  return (
    <>
      {/* --- CSS ANIMATION CHO VIỀN "GIỎ HÀNG TRỐNG" ---
       */}
      <style jsx>{`
        @keyframes google-gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-google-border {
          background-size: 300% 300%;
          animation: google-gradient 3s ease infinite;
        }
      `}</style>

      {/* --- TOAST THÔNG BÁO (STYLE GOOGLE AI) --- */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] 
          transition-all duration-300 ease-out
          ${
            showToast
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4 invisible"
          }
        `}
      >
        {/* Lớp vỏ chứa Gradient động (Tạo viền) */}
        <div className="p-[2px] rounded-full animate-google-border bg-gradient-to-r from-blue-500 via-red-500 via-yellow-400 to-green-500 shadow-xl">
          {/* Lớp lõi nền trắng mờ (Nội dung) */}
          <div className="bg-white/90 backdrop-blur-md rounded-full px-6 py-3">
            <span className="text-gray-900 font-bold text-sm whitespace-nowrap">
              Giỏ hàng trống!
            </span>
          </div>
        </div>
      </div>

      {/* --- MAIN SHEET --- */}
      <div className="fixed inset-0 z-50">
        <div
          onClick={onClose}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300
            ${isClosing ? "opacity-0" : "opacity-100"} 
          `}
        />

        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] max-h-[95vh] flex flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out
            ${isClosing ? "translate-y-full" : "animate-slide-up translate-y-0"}
          `}
        >
          <div className="w-12 h-1 bg-gray-200/80 rounded-full mx-auto mt-3 mb-1" />

          <div className="px-5 pt-2 pb-4 flex justify-between items-center relative">
            <div className="text-center w-full">
              <h2 className="text-lg font-bold text-gray-900">Chi Tiết Đơn</h2>
              <p className="text-[11px] text-gray-500 font-medium">
                Cửa hàng đang chờ bạn gửi đơn
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-base hover:bg-gray-200 transition"
            >
              ✕
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 space-y-4 pt-2 pb-6">
              {items.map((i) => (
                <div key={i.foodId} className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                    <img
                      src={i.image_url || "/placeholder-food.png"}
                      alt={i.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-extrabold text-gray-900 line-clamp-1">
                        {i.name}
                      </h3>
                      <button
                        onClick={() => removeItem(i.foodId)}
                        className="text-gray-300 hover:text-red-500 transition -mt-1 -mr-1 p-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-orange-600 font-bold text-sm">
                        {(i.price * i.quantity).toLocaleString()}đ
                      </span>
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg h-7 shadow-sm">
                        <button
                          onClick={() => decrease(i.foodId)}
                          className="w-7 h-full flex items-center justify-center text-gray-400 hover:text-orange-600 font-bold transition"
                        >
                          -
                        </button>
                        <span className="min-w-[20px] text-center text-xs font-bold text-gray-900">
                          {i.quantity}
                        </span>
                        <button
                          onClick={() => increase(i.foodId)}
                          className="w-7 h-full flex items-center justify-center text-gray-400 hover:text-orange-600 font-bold transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px bg-gray-100 mx-5 mb-5"></div>

            <div className="px-5 space-y-6 pb-6">
              <div>
                <div className={labelStyle}>Bạn muốn nhận món tại đâu?</div>
                <div className="flex bg-gray-100 rounded-full p-1">
                  <button
                    onClick={() => setOrderType(OrderType.DINE_IN)}
                    className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all items-center justify-center flex gap-1 ${
                      orderType === OrderType.DINE_IN
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span>🍽</span> Dùng tại bàn
                  </button>
                  <button
                    onClick={() => setOrderType(OrderType.TAKEAWAY)}
                    className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all items-center justify-center flex gap-1 ${
                      orderType === OrderType.TAKEAWAY
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span>🛍</span> Mang về
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={labelStyle}>Số bàn</label>
                  <input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="VD: B01"
                    // KHÔNG sửa được số bàn khi quét QR:
                    // readOnly={!!tableFromUrl}
                    className={inputStyle}
                  />
                </div>
                <div className="flex-[1.5]">
                  <label className={labelStyle}>Tên của bạn</label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Không bắt buộc"
                    className={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label className={labelStyle}>Ghi chú đặc biệt</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ít cay, không lấy mắm tôm, ăn nước mắm..."
                  className={`${inputStyle} resize-none h-20 py-3`}
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-50 bg-white safe-bottom">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-900 font-bold uppercase text-xs tracking-wide">
                Tổng cộng
              </span>
              <span className="text-xl font-black text-orange-600">
                {totalPrice.toLocaleString()}đ
              </span>
            </div>
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || items.length === 0} // Disable khi đang gửi or giỏ trống
              className={`w-full py-3.5 rounded-full font-bold text-base shadow-md transition flex items-center justify-center gap-2
                 ${
                   isSubmitting
                     ? "bg-gray-400 cursor-wait text-white"
                     : "bg-orange-600 text-white shadow-orange-600/20 hover:bg-orange-700 active:scale-[0.98]"
                 }
              `}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Đang gửi...
                </>
              ) : (
                <>
                  <span className="text-sm">🚀</span> GỬI ĐƠN NGAY
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
