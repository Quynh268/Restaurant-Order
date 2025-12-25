"use client";

import { useEffect, useState } from "react";
import { getComboItems } from "@/lib/api";
import { useCart } from "@/app/context/CartContext";

type Food = {
  id: number;
  name: string;
  price: number;
  image_url?: string | null;
  is_combo: boolean;
};

export default function FoodCard({ food }: { food: Food }) {
  const [items, setItems] = useState<string[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    getComboItems(food.id).then((res) => {
      if (res && res.length > 0) {
        setItems(res.map((i) => i.item_name));
      } else {
        setItems([]);
      }
    });
  }, [food.id]);

  return (
    <div className="flex gap-3 bg-white rounded-xl p-3 shadow-sm">
      <div className="w-24 h-24 relative flex-shrink-0">
        {/* Ảnh */}
        <div
          className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100
               flex items-center justify-center text-gray-400 text-sm"
        >
          {food.image_url ? (
            <img
              src={food.image_url}
              alt={food.name}
              className="w-full h-full object-cover"
            />
          ) : (
            "No image"
          )}
        </div>

        {/* NÚT + ĐÈ LÊN ẢNH – GÓC DƯỚI PHẢI */}
        <button
          onClick={() =>
            addItem({
              foodId: food.id,
              name: food.name,
              price: food.price,
            })
          }
          className="absolute -bottom-2 -right-2
               w-8 h-8 rounded-full
               bg-orange-500 text-white text-lg
               flex items-center justify-center
               shadow-md active:scale-95"
        >
          +
        </button>
      </div>

      {/* Nội dung */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          <div className="font-semibold text-gray-900">{food.name}</div>

          {/* DÒNG XÁM CHO COMBO */}
          {items.length > 0 && (
            <div className="text-xs text-gray-400 mt-1 leading-snug line-clamp-2">
              {items.join(", ")}
            </div>
          )}
        </div>

        <div className="text-orange-600 font-bold mt-2">
          {food.price.toLocaleString()}đ
        </div>
      </div>
    </div>
  );
}
