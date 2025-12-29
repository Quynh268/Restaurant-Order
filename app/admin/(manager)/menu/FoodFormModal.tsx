"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

// Type cho món ăn
export type FoodItem = {
  id?: number;
  name: string;
  price: number;
  image_url: string | null;
  category_id: number;
  is_combo: boolean;
  is_available: boolean;
  // Bỏ description
};

// Type cho thành phần Combo
export type ComboItem = {
  id?: number;
  item_name: string;
  quantity?: number; // Nếu muốn lưu số lượng (VD: 2 cái nem)
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (foodData: FoodItem, comboItems: string[]) => void; // <--- Cập nhật hàm Save
  initialData?: FoodItem | null;
  existingComboItems?: string[]; // <--- Nhận danh sách thành phần cũ
  categories: { id: number; name: string }[];
  allFoods: FoodItem[]; // <--- Nhận toàn bộ menu để chọn
};

export default function FoodFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingComboItems = [],
  categories,
  allFoods,
}: Props) {
  const [formData, setFormData] = useState<FoodItem>({
    name: "",
    price: 0,
    image_url: null,
    category_id: categories[0]?.id || 0,
    is_combo: false,
    is_available: true,
  });

  // State quản lý danh sách thành phần combo
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
        setPreviewUrl(initialData.image_url);
        setSelectedComponents(existingComboItems); // Load thành phần cũ lên
      } else {
        // Reset form
        setFormData({
          name: "",
          price: 0,
          image_url: null,
          category_id: categories[0]?.id || 0,
          is_combo: false, // Mặc định tắt combo
          is_available: true,
        });
        setPreviewUrl(null);
        setSelectedComponents([]);
      }
    }
  }, [isOpen, initialData, existingComboItems, categories]);

  // Xử lý thêm 1 thành phần vào Combo
  const addComponent = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const foodName = e.target.value;
    if (foodName && !selectedComponents.includes(foodName)) {
      setSelectedComponents([...selectedComponents, foodName]);
    }
    // Reset select về mặc định
    e.target.value = "";
  };

  // Xử lý xóa thành phần
  const removeComponent = (nameToRemove: string) => {
    setSelectedComponents(
      selectedComponents.filter((name) => name !== nameToRemove)
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (Giữ nguyên code upload ảnh cũ của bạn) ...
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Giả lập upload để lấy logic, bạn áp dụng lại code upload thật ở đây
    setUploading(true);
    try {
      const fileName = `${Date.now()}.${file.name.split(".").pop()}`;
      await supabase.storage.from("menu-images").upload(fileName, file);
      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(fileName);
      setFormData((prev) => ({ ...prev, image_url: data.publicUrl }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    // Truyền dữ liệu ra ngoài cho page.tsx xử lý
    onSave(formData, selectedComponents);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-[900px] max-w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-black text-gray-800">
            {initialData ? "Chỉnh Sửa Món" : "Thêm Món Mới"}
          </h2>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition"
            >
              {uploading ? "Đang tải ảnh..." : "💾 Lưu món ăn"}
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-8 overflow-y-auto bg-gray-50 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* CỘT TRÁI: ẢNH */}
          <div className="md:col-span-4 flex flex-col gap-4">
            {/* ... (Giữ nguyên code hiển thị ảnh của bạn) ... */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden relative"
            >
              {previewUrl ? (
                <img src={previewUrl} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400">📷 Tải ảnh lên</span>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* CỘT PHẢI: FORM */}
          <div className="md:col-span-8 space-y-5">
            {/* ... (Giữ nguyên Loại món, Tên món, Giá) ... */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Tên món
              </label>
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white border border-gray-200 px-4 py-3 rounded-lg font-bold"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Giá bán
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  className="w-full bg-white border border-gray-200 px-4 py-3 rounded-lg font-bold"
                />
              </div>
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_combo}
                    onChange={(e) =>
                      setFormData({ ...formData, is_combo: e.target.checked })
                    }
                    className="w-5 h-5 accent-orange-500 rounded"
                  />
                  <span className="font-bold text-gray-700">Gói Combo</span>
                </label>
              </div>
            </div>

            {/* --- PHẦN CHỌN THÀNH PHẦN COMBO (THAY THẾ DESCRIPTION) --- */}
            {formData.is_combo && (
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <label className="block text-xs font-bold text-orange-800 uppercase mb-2">
                  Thành phần trong Combo
                </label>

                {/* Dropdown chọn món có sẵn */}
                <select
                  onChange={addComponent}
                  className="w-full bg-white border border-orange-200 text-gray-700 px-4 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">+ Chọn món thêm vào combo...</option>
                  {allFoods.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>

                {/* Danh sách đã chọn */}
                <div className="flex flex-wrap gap-2">
                  {selectedComponents.length === 0 && (
                    <span className="text-sm text-gray-400 italic">
                      Chưa có thành phần nào.
                    </span>
                  )}
                  {selectedComponents.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm"
                    >
                      {item}
                      <button
                        onClick={() => removeComponent(item)}
                        className="w-4 h-4 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!formData.is_combo && (
              <p className="text-xs text-gray-400 italic">
                Đây là món đơn lẻ (như Trà đá, Bún thêm...). Nếu là Combo (Mẹt
                bún đậu), hãy tích vào ô "Gói Combo".
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
