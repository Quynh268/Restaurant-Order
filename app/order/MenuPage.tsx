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

      // Lấy Foods (Kèm combo items để hiển thị thành phần)
      const { data: foodData } = await supabase
        .from("foods")
        .select(
          `
            *,
            combo_items ( item_name )
        `
        )
        .eq("is_available", true)
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

  // --- LỌC MÓN THEO DANH MỤC ĐANG CHỌN ---
  // Nếu chưa load xong (selectedCatId null) thì tạm thời list rỗng để tránh hiện tất cả
  const filteredFoods = selectedCatId
    ? foods.filter((f) => f.category_id === selectedCatId)
    : [];

  // --- TÁCH NHÓM ĐỂ HIỂN THỊ ---
  const comboList = filteredFoods.filter((f) => f.is_combo);
  const addonList = filteredFoods.filter((f) => f.is_addon);
  const mainList = filteredFoods.filter((f) => !f.is_combo && !f.is_addon);

  return (
    <div className="pb-20">
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
              {comboList.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
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
              {mainList.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
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
              {addonList.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
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
