"use client";

import { useEffect, useState } from "react";
import { getCategories, getFoodsByCategory } from "@/lib/api";
import FoodCard from "./FoodCard";
import Footer from "./Footer";
import FloatingCartBar from "./FloatingCartBar";
import CartSheet from "./CartSheet";

type Category = {
  id: number;
  name: string;
};

type Food = {
  id: number;
  name: string;
  price: number;
  image_url?: string | null;
  is_combo: boolean;
};

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [openCart, setOpenCart] = useState(false);

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setActiveCategory(cats[0].id);
    });
  }, []);

  useEffect(() => {
    if (activeCategory) {
      getFoodsByCategory(activeCategory).then(setFoods);
    }
  }, [activeCategory]);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap
              ${
                activeCategory === cat.id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* List món */}
      <div className="flex flex-col gap-3">
        {foods.map((food) => (
          <FoodCard key={food.id} food={food} />
        ))}
      </div>

      <div className="pb-6">
        {/* menu + food list */}
        <Footer />
      </div>

      <div className="pb-24">
        {/* menu + food list */}
        <FloatingCartBar onOpen={() => setOpenCart(true)} />
        <CartSheet open={openCart} onClose={() => setOpenCart(false)} />
      </div>
    </div>
  );
}
