"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { OrderUI } from "./page";

type Props = {
  order: OrderUI;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};

type MenuFood = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  category_id: number;
};

type Category = {
  id: number;
  name: string;
};

export default function EditOrderModal({
  order,
  isOpen,
  onClose,
  onSave,
}: Props) {
  // State quản lý danh sách món đang chỉnh sửa
  const [editingItems, setEditingItems] = useState(order.items);

  // State cho Menu bên phải
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<MenuFood[]>([]);
  const [expandedCat, setExpandedCat] = useState<number | null>(null); // Accordion
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Tính tổng tiền mới
  const newTotal = editingItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Load Menu (Danh mục + Món ăn) khi mở Modal
  useEffect(() => {
    if (isOpen) {
      setEditingItems(order.items); // Reset về item hiện tại của đơn
      fetchMenu();
    }
  }, [isOpen, order]);

  async function fetchMenu() {
    setLoadingMenu(true);
    // Lấy danh mục
    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (cats) {
      setCategories(cats);
      if (cats.length > 0) setExpandedCat(cats[0].id); // Mở sẵn cái đầu tiên
    }

    // Lấy món ăn
    const { data: f } = await supabase
      .from("foods")
      .select("id, name, price, image_url, category_id")
      .eq("is_available", true);
    if (f) setFoods(f);
    setLoadingMenu(false);
  }

  // --- LOGIC CHỈNH SỬA ---

  // 1. Tăng/Giảm số lượng món đã có
  const updateQuantity = (foodId: number, delta: number) => {
    setEditingItems(
      (prev) =>
        prev
          .map((item) => {
            if (item.food_id === foodId) {
              return { ...item, quantity: Math.max(0, item.quantity + delta) };
            }
            return item;
          })
          .filter((item) => item.quantity > 0) // Nếu về 0 thì xóa luôn
    );
  };

  // 2. Thêm món mới từ Menu bên phải
  const addToOrder = (food: MenuFood) => {
    setEditingItems((prev) => {
      const exists = prev.find((i) => i.food_id === food.id);
      if (exists) {
        // Nếu đã có thì tăng số lượng
        return prev.map((i) =>
          i.food_id === food.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      // Chưa có thì thêm mới
      return [
        ...prev,
        {
          food_id: food.id,
          food_name: food.name,
          price: food.price,
          quantity: 1,
          image_url: food.image_url,
        },
      ];
    });
  };

  // 3. Lưu thay đổi
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // B1: Xóa hết item cũ của đơn này
      await supabase.from("order_items").delete().eq("order_id", order.id);

      // B2: Insert lại danh sách mới
      const newItemsPayload = editingItems.map((item) => ({
        order_id: order.id,
        food_id: item.food_id,
        food_name: item.food_name, // Snapshot tên
        price: item.price, // Snapshot giá
        quantity: item.quantity,
      }));

      if (newItemsPayload.length > 0) {
        await supabase.from("order_items").insert(newItemsPayload);
      }

      // B3: Cập nhật tổng tiền đơn hàng
      await supabase
        .from("orders")
        .update({
          total_amount: newTotal,
          // Có thể thêm logic cập nhật note nếu cần
        })
        .eq("id", order.id);

      alert("Cập nhật đơn hàng thành công!");
      onSave(); // Gọi hàm refresh ở cha
      onClose();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu đơn hàng");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-[1000px] max-w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* --- HEADER --- */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-extrabold text-gray-800">
              Chỉnh sửa đơn {order.code}
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Bàn: {order.tableCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
          >
            ✕
          </button>
        </div>

        {/* --- BODY (2 CỘT) --- */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-gray-50">
          {/* CỘT TRÁI: Món hiện có */}
          <div className="p-5 flex flex-col h-full overflow-hidden border-r border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Món hiện có trong đơn
              </h3>
              <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-full">
                {editingItems.length} món
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {editingItems.length === 0 && (
                <p className="text-center text-gray-400 py-10">
                  Đơn hàng trống
                </p>
              )}
              {editingItems.map((item) => (
                <div
                  key={item.food_id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:shadow-sm bg-white transition"
                >
                  <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 truncate text-sm">
                      {item.food_name}
                    </div>
                    <div className="text-orange-600 font-bold text-sm">
                      {item.price.toLocaleString()}đ
                    </div>
                  </div>
                  {/* Quantity Control */}
                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 h-9">
                    <button
                      onClick={() => updateQuantity(item.food_id, -1)}
                      className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-l-lg font-bold"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.food_id, 1)}
                      className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-r-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: Menu thêm món */}
          <div className="p-5 flex flex-col h-full overflow-hidden bg-gray-50/50">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Thêm món mới vào đơn
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {loadingMenu ? (
                <p className="text-center text-gray-400">Đang tải menu...</p>
              ) : (
                categories.map((cat) => {
                  const catFoods = foods.filter(
                    (f) => f.category_id === cat.id
                  );
                  const isExpanded = expandedCat === cat.id;
                  if (catFoods.length === 0) return null;

                  return (
                    <div
                      key={cat.id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                    >
                      {/* Accordion Header */}
                      <button
                        onClick={() =>
                          setExpandedCat(isExpanded ? null : cat.id)
                        }
                        className="w-full px-4 py-3 flex justify-between items-center bg-white hover:bg-gray-50 transition"
                      >
                        <span
                          className={`font-bold text-sm ${
                            isExpanded ? "text-orange-600" : "text-gray-700"
                          }`}
                        >
                          {cat.name}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {catFoods.length} món {isExpanded ? "▲" : "▼"}
                        </span>
                      </button>

                      {/* Accordion Body - Có Scrollbar nếu dài (Giống ảnh 3) */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 max-h-[300px] overflow-y-auto bg-gray-50 p-2 space-y-2 custom-scrollbar">
                          {catFoods.map((food) => (
                            <div
                              key={food.id}
                              className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md bg-gray-200 overflow-hidden">
                                  <img
                                    src={food.image_url || "/placeholder.png"}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-800">
                                    {food.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {food.price.toLocaleString()}đ
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => addToOrder(food)}
                                className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 font-bold text-lg transition"
                              >
                                +
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase block">
              Giá trị đơn hàng mới
            </span>
            <span className="text-2xl font-black text-orange-600">
              {newTotal.toLocaleString()}đ
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition flex items-center gap-2"
            >
              {isSaving ? "Đang lưu..." : "Lưu đơn hàng ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
