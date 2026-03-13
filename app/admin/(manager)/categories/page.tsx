"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// 1. CHUẨN HÓA KIỂU DỮ LIỆU
type Category = {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  
  // Dùng refreshKey để load lại data an toàn (Tránh lỗi Linter)
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchCats() {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (data) setCategories(data as Category[]);
    }
    
    fetchCats();
  }, [refreshKey]);

  async function handleAdd() {
    if (!newCatName.trim()) return;

    // Tìm số thứ tự lớn nhất hiện tại để xếp loại mới xuống cuối
    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order || 0)) : 0;

    const { error } = await supabase
      .from("categories")
      .insert({ 
        name: newCatName.trim(), 
        is_active: true,
        sort_order: maxOrder + 1
      });

    if (error) {
      alert("Lỗi khi thêm: " + error.message);
    } else {
      setNewCatName("");
      setRefreshKey(prev => prev + 1); // Load lại danh sách
    }
  }

  // --- LOGIC XÓA / VÔ HIỆU HÓA THÔNG MINH ---
  async function handleDelete(id: number, name: string) {
    if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn loại món "${name}"?`)) return;

    try {
      // 1. Thử xóa vĩnh viễn (Hard Delete)
      const { error } = await supabase.from("categories").delete().eq("id", id);
      
      if (error) {
        // 2. Nếu Supabase chặn vì lỗi Khóa ngoại (Đã có món ăn / Lịch sử order)
        if (error.message.includes("foreign key") || error.message.includes("violates")) {
          const confirmDisable = confirm(
            `❌ KHÔNG THỂ XÓA VĨNH VIỄN "${name}" vì đang có món ăn thuộc loại này hoặc đã có hóa đơn liên quan!\n\nBạn có muốn VÔ HIỆU HÓA (Ẩn) loại món này thay vì xóa không?`
          );
          
          if (confirmDisable) {
            // Thực hiện Soft Delete (Cập nhật is_active = false)
            await supabase.from("categories").update({ is_active: false }).eq("id", id);
            alert(`Đã vô hiệu hóa loại món "${name}"!`);
            setRefreshKey(prev => prev + 1);
          }
        } else {
          throw error; // Lỗi khác thì quăng ra catch
        }
      } else {
        // Xóa thành công (Loại món chưa từng được dùng)
        alert(`Đã xóa sạch loại món "${name}"!`);
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      const err = error as Error;
      alert("Lỗi hệ thống khi xóa: " + err.message);
    }
  }

  // --- HÀM KHÔI PHỤC LOẠI MÓN ĐÃ BỊ ẨN ---
  async function handleRestore(id: number, name: string) {
    if (confirm(`Khôi phục hoạt động cho loại món "${name}"?`)) {
      await supabase.from("categories").update({ is_active: true }).eq("id", id);
      setRefreshKey(prev => prev + 1);
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Danh sách loại món ăn
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Phân loại menu để khách hàng dễ lựa chọn
          </p>
        </div>
        <button className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition">
          💾 Lưu thay đổi
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          
          {categories.map((cat, index) => (
            <div key={cat.id}>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Loại {index + 1} {cat.is_active ? "" : "(Đã ẩn)"}
              </label>
              
              <div className="relative group">
                {/* Giao diện thay đổi màu nếu bị vô hiệu hóa */}
                <div className={`w-full px-4 py-3 rounded-lg font-bold truncate transition-colors ${
                  cat.is_active 
                    ? "bg-gray-800 text-white" 
                    : "bg-gray-100 text-gray-400 line-through border border-gray-200"
                }`}>
                  {cat.name}
                </div>

                {/* Nút Xóa / Nút Khôi phục tự động đổi dựa trên trạng thái */}
                {cat.is_active ? (
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="absolute top-0 right-0 h-full w-8 bg-red-500 text-white rounded-r-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center font-bold"
                    title="Xóa loại này"
                  >
                    ×
                  </button>
                ) : (
                  <button
                    onClick={() => handleRestore(cat.id, cat.name)}
                    className="absolute top-0 right-0 h-full w-8 bg-green-500 text-white rounded-r-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center font-bold"
                    title="Khôi phục lại"
                  >
                    ↺
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Ô INPUT THÊM MỚI */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">
              Thêm mới
            </label>
            <div className="flex gap-2">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nhập tên loại..."
                // Dùng min-w-0 để ô input không bị tràn ra ngoài
                className="flex-1 min-w-0 bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg text-sm text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:italic placeholder:font-normal placeholder:text-gray-400 transition"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
              />
              <button
                onClick={handleAdd}
                // Thêm shrink-0 và set cứng w-11 h-[46px] để nút thành hình vuông hoàn hảo
                className="shrink-0 w-[46px] h-[46px] bg-orange-100 text-orange-600 rounded-lg font-bold hover:bg-orange-200 transition text-xl flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3 text-orange-800 text-sm font-medium">
          <span className="text-xl">💡</span>
          Các loại món ăn sẽ xuất hiện trên thanh trượt ngang tại màn hình của khách hàng.
        </div>
      </div>
    </div>
  );
}