"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    fetchCats();
  }, []);

  async function fetchCats() {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (data) setCategories(data);
  }

  async function handleAdd() {
    if (!newCatName) return;
    await supabase
      .from("categories")
      .insert({ name: newCatName, is_active: true });
    setNewCatName("");
    fetchCats();
  }

  async function handleDelete(id: number) {
    if (confirm("Xóa loại này?")) {
      await supabase.from("categories").delete().eq("id", id);
      fetchCats();
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Danh sách loại món ăn
          </h1>
          <p className="text-gray-500 text-sm">
            Phân loại menu để khách hàng dễ lựa chọn
          </p>
        </div>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700">
          💾 Lưu thay đổi
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <div className="grid grid-cols-4 gap-4 items-end">
          {categories.map((cat, index) => (
            <div key={cat.id}>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Loại {index + 1}
              </label>
              <div className="relative group">
                <div className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg font-bold truncate">
                  {cat.name}
                </div>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="absolute top-0 right-0 h-full w-8 bg-red-500 text-white rounded-r-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {/* Input thêm mới */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">
              Thêm mới
            </label>
            <div className="flex gap-2">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nhập tên loại..."
                className="flex-1 bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 italic"
              />
              <button
                onClick={handleAdd}
                className="bg-orange-100 text-orange-600 px-3 rounded-lg font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100 flex items-center gap-3 text-orange-800 text-sm">
          <span>💡</span>
          Các loại món ăn sẽ xuất hiện trên thanh trượt ngang tại màn hình của
          khách hàng.
        </div>
      </div>
    </div>
  );
}
