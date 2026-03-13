"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import FoodCard from "./FoodCard";
import { Food, Category } from "@/lib/type";
import Footer from "./Footer";

export default function MenuPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // State lưu category đang chọn
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      // Lấy Categories
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (cats && cats.length > 0) {
        setCategories(cats);
        setSelectedCatId(cats[0].id);
      }

      // Lấy Foods (Kèm combo items)
      // ⚠️ ĐÃ XÓA .eq("is_available", true) ĐỂ LẤY CẢ CÁC MÓN ĐÃ HẾT VỀ ĐÓNG DẤU
      const { data: foodData } = await supabase
        .from("foods")
        .select(`*, combo_items ( item_name )`)
        .order("id", { ascending: false });

      if (foodData) {
        // Sắp xếp: Combo -> Món thường -> Món lẻ
        const sorted = foodData.sort((a: Food, b: Food) => {
          const getScore = (item: Food) => {
            if (item.is_combo) return 1;
            if (item.is_addon) return 3;
            return 2;
          };
          const scoreA = getScore(a);
          const scoreB = getScore(b);

          if (scoreA !== scoreB) return scoreA - scoreB;
          return b.id - a.id;
        });
        setFoods(sorted);
      }
    }
    fetchMenu();
  }, []);

  const filteredFoods = selectedCatId
    ? foods.filter((f) => f.category_id === selectedCatId)
    : [];

  const comboList = filteredFoods.filter((f) => f.is_combo);
  const addonList = filteredFoods.filter((f) => f.is_addon);
  const mainList = filteredFoods.filter((f) => !f.is_combo && !f.is_addon);

  // --- HÀM BỌC FOOD CARD ĐỂ ĐÓNG DẤU (VIẾT GỘP CHO ĐỠ RỐI CODE) ---
  const renderFoodWithStamp = (food: Food) => (
    <div key={food.id} className="relative">
      {/* NẾU HẾT MÓN -> HIỆN MÀNG CHẮN */}
      {food.is_available === false && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50/60 rounded-xl backdrop-blur-[1px] cursor-not-allowed">
          
        </div>
      )}

      {/* THẺ MÓN ĂN GỐC (Bị làm mờ và chặn click nếu hết món) */}
      <div className={food.is_available === false ? "opacity-60 grayscale-[0.5] pointer-events-none" : ""}>
        <FoodCard food={food} />
      </div>
    </div>
  );

  return (
    <div className="pb-4">
      {/* THANH DANH MỤC (Ngang) */}
      <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCatId(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition ${
              selectedCatId === cat.id
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* DANH SÁCH MÓN ĂN */}
      <div className="p-4 space-y-6">
        
        {/* KHU VỰC COMBO */}
        {comboList.length > 0 && (
          <div>
            <h3 className="text-lg font-black text-orange-600 mb-3 flex items-center gap-2">
              🔥 Combo Hot
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {comboList.map(renderFoodWithStamp)}
            </div>
          </div>
        )}

        {/* KHU VỰC MÓN CHÍNH */}
        {mainList.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-orange-500 pl-2">
              Món Ngon
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {mainList.map(renderFoodWithStamp)}
            </div>
          </div>
        )}

        {/* KHU VỰC MÓN THÊM */}
        {addonList.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-500 mb-3 border-l-4 border-gray-300 pl-2">
              Món Gọi Thêm
            </h3>
            <div className="grid gap-3">
              {addonList.map(renderFoodWithStamp)}
            </div>
          </div>
        )}

        {filteredFoods.length === 0 && selectedCatId && (
          <div className="text-center py-10 text-gray-400">
            Không tìm thấy món ăn nào trong mục này.
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}