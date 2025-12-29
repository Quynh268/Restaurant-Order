"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function MenuPage() {
  const [foods, setFoods] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedFood, setSelectedFood] = useState<any | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    category_id: 0,
    is_combo: false,
    is_addon: false,
    image_url: "" as string | null,
  });

  const [comboComponents, setComboComponents] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // Load danh sách món
    const { data: f } = await supabase
      .from("foods")
      .select("*, categories(name)")
      .order("id", { ascending: false });

    if (f) setFoods(f);

    // Load danh mục
    const { data: c } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (c) {
      setCategories(c);
      if (!selectedFood && c.length > 0) {
        setFormData((prev) => ({ ...prev, category_id: c[0].id }));
      }
    }
  }

  // --- XỬ LÝ KHI CHỌN MÓN ĐỂ SỬA ---
  useEffect(() => {
    if (selectedFood) {
      setFormData({
        name: selectedFood.name,
        price: selectedFood.price,
        category_id: selectedFood.category_id,
        is_combo: selectedFood.is_combo,
        is_addon: selectedFood.is_addon || false,
        image_url: selectedFood.image_url,
      });

      if (selectedFood.is_combo) fetchComboItems(selectedFood.id);
      else setComboComponents([]);
    } else {
      // Reset Form
      setFormData({
        name: "",
        price: 0,
        category_id: categories[0]?.id || 0,
        is_combo: false,
        is_addon: false,
        image_url: null,
      });
      setComboComponents([]);
    }
  }, [selectedFood, categories]);

  async function fetchComboItems(foodId: number) {
    const { data } = await supabase
      .from("combo_items")
      .select("item_name")
      .eq("combo_id", foodId)
      .order("sort_order");
    if (data) setComboComponents(data.map((item: any) => item.item_name));
  }

  const addComboComponent = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemName = e.target.value;
    if (itemName && !comboComponents.includes(itemName)) {
      setComboComponents([...comboComponents, itemName]);
    }
    e.target.value = "";
  };

  const removeComboComponent = (itemToRemove: string) => {
    setComboComponents(comboComponents.filter((i) => i !== itemToRemove));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const objectUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image_url: objectUrl }));
    setUploading(true);

    try {
      const fileName = `${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage
        .from("menu-images")
        .upload(fileName, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(fileName);
      setFormData((prev) => ({ ...prev, image_url: data.publicUrl }));
    } catch (err: any) {
      console.error(err);
      alert("Lỗi upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) return alert("Vui lòng nhập tên món");
    if (isSaving) return;

    setIsSaving(true); // Bắt đầu quá trình Lưu - > Khóa btn

    try {
      if (!selectedFood) {
        const { data: existing } = await supabase
          .from("foods")
          .select("id")
          .ilike("name", formData.name.trim())
          .maybeSingle();
        if (existing) {
          alert("Tên món đã tồn tại");
          setIsSaving(false);
          return;
        }
      }

      const payload = {
        name: formData.name,
        price: formData.price,
        category_id: formData.category_id,
        is_combo: formData.is_combo,
        is_addon: formData.is_addon,
        image_url: formData.image_url,
        is_available: true,
      };

      let savedFoodId = selectedFood?.id;

      if (selectedFood) {
        const { error } = await supabase
          .from("foods")
          .update(payload)
          .eq("id", selectedFood.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("foods")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        savedFoodId = data.id;
      }

      if (formData.is_combo && savedFoodId) {
        await supabase.from("combo_items").delete().eq("combo_id", savedFoodId);
        if (comboComponents.length > 0) {
          const comboData = comboComponents.map((name, idx) => ({
            combo_id: savedFoodId,
            item_name: name,
            sort_order: idx + 1,
          }));
          const { error: comboError } = await supabase
            .from("combo_items")
            .insert(comboData);
          if (comboError) throw comboError;
        }
      }

      alert("Lưu món ăn thành công!");
      fetchData();
      setSelectedFood(null);
    } catch (err: any) {
      console.error(err);
      alert("Có lỗi xảy ra: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- LOGIC CHIA NHÓM ĐỂ HIỂN THỊ ---
  const filteredFoods = selectedCatId
    ? foods.filter((f) => f.category_id === selectedCatId)
    : foods;

  const comboList = filteredFoods.filter((f) => f.is_combo);
  const addonList = filteredFoods.filter((f) => f.is_addon);
  const mainList = filteredFoods.filter((f) => !f.is_combo && !f.is_addon);

  // Component con để render từng món (đỡ lặp code)
  const FoodItemCard = ({ food }: { food: any }) => (
    <div
      onClick={() => setSelectedFood(food)}
      className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition bg-white
        ${
          selectedFood?.id === food.id
            ? "border-orange-500 ring-1 ring-orange-500 bg-orange-50"
            : "border-gray-100 hover:bg-gray-50"
        }
      `}
    >
      <img
        src={food.image_url || "/placeholder.png"}
        className="w-10 h-10 rounded-lg object-cover bg-gray-200"
      />
      <div className="text-left flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-800 line-clamp-1">
          {food.name}
        </div>
        <div className="text-xs text-gray-500">
          {food.price.toLocaleString()}đ
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 animate-fade-in">
      {/* --- CỘT TRÁI: DANH SÁCH --- */}
      <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col">
        <h2 className="font-bold text-gray-800 mb-4">Danh sách món</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCatId(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedCatId === null
                ? "bg-orange-100 text-orange-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCatId(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCatId === c.id
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <button
            onClick={() => setSelectedFood(null)}
            className={`w-full p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 font-bold transition mb-4 ${
              selectedFood === null
                ? "border-orange-500 text-orange-600 bg-orange-50"
                : "border-gray-300 text-gray-400 hover:bg-gray-50"
            }`}
          >
            + Thêm món mới
          </button>

          {/* NHÓM 1: COMBO */}
          {comboList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-orange-600 uppercase mb-2 pl-1 flex items-center gap-1">
                <span>🔥</span> Combo cho bạn
              </h3>
              <div className="space-y-2">
                {comboList.map((food) => (
                  <FoodItemCard key={food.id} food={food} />
                ))}
              </div>
            </div>
          )}

          {/* NHÓM 2: MÓN CHÍNH */}
          {mainList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-600 uppercase mb-2 pl-1">
                Món chính
              </h3>
              <div className="space-y-2">
                {mainList.map((food) => (
                  <FoodItemCard key={food.id} food={food} />
                ))}
              </div>
            </div>
          )}

          {/* NHÓM 3: MÓN LẺ */}
          {addonList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 pl-1">
                Món dùng thêm
              </h3>
              <div className="space-y-2">
                {addonList.map((food) => (
                  <FoodItemCard key={food.id} food={food} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredFoods.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-10 italic">
              Chưa có món nào trong danh mục này.
            </div>
          )}
        </div>
      </div>

      {/* --- CỘT PHẢI: FORM NHẬP LIỆU --- */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-800">
            {selectedFood ? "Chỉnh sửa món" : "Thêm món mới"}
          </h2>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition"
          >
            {isSaving ? "Đang lưu..." : "💾 Lưu món ăn"}
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-orange-400 transition overflow-hidden relative"
            >
              {formData.image_url ? (
                <img
                  src={formData.image_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <span className="text-4xl mb-2">📷</span>
                  <span className="text-xs font-bold">Tải ảnh lên</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
                  Uploading...
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          <div className="col-span-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Loại món ăn
              </label>
              <select
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category_id: Number(e.target.value),
                  })
                }
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg font-bold focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Tên món
              </label>
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg font-bold placeholder:text-gray-500 focus:outline-none"
                placeholder="VD: Combo đôi bạn"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Giá món (VNĐ)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg font-bold focus:outline-none"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-end pb-3 gap-6">
                <label
                  className={`flex items-center gap-2 cursor-pointer select-none ${
                    formData.is_addon ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_combo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_combo: e.target.checked,
                        is_addon: false,
                      })
                    }
                    className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                  />
                  <span className="font-bold text-gray-700">Gói Combo</span>
                </label>

                <label
                  className={`flex items-center gap-2 cursor-pointer select-none ${
                    formData.is_combo ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_addon}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_addon: e.target.checked,
                        is_combo: false,
                      })
                    }
                    className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                  />
                  <span className="font-bold text-gray-700">Món Thêm</span>
                </label>
              </div>
            </div>

            {formData.is_combo ? (
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-fade-in">
                <label className="block text-xs font-bold text-orange-800 uppercase mb-2">
                  Thành phần trong Combo
                </label>
                <select
                  onChange={addComboComponent}
                  className="w-full bg-white border border-orange-200 text-gray-700 px-4 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  <option value="">+ Chọn món thêm vào combo...</option>
                  {foods
                    .filter((f) => f.id !== selectedFood?.id)
                    .map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  {comboComponents.length === 0 && (
                    <span className="text-sm text-gray-400 italic">
                      Chưa có thành phần nào.
                    </span>
                  )}
                  {comboComponents.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm animate-fade-in"
                    >
                      {item}
                      <button
                        onClick={() => removeComboComponent(item)}
                        className="w-4 h-4 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={`p-4 rounded-xl border border-gray-100 text-sm italic text-center transition-colors ${
                  formData.is_addon
                    ? "bg-gray-100 text-gray-500"
                    : "bg-white text-gray-400"
                }`}
              >
                {formData.is_addon
                  ? "Đây là món lẻ (gọi thêm), sẽ hiển thị ở nhóm cuối cùng."
                  : "Đây là món chính thường, sẽ hiển thị ở nhóm giữa."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
