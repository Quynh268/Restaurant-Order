"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU RÕ RÀNG
type Area = {
  id: number;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  
  // --- STATE "CÒ SÚNG" ĐỂ LOAD LẠI DATA ---
  const [refreshKey, setRefreshKey] = useState(0);

  // Đưa toàn bộ logic fetch vào trong useEffect để Linter hết báo lỗi
  useEffect(() => {
    async function loadAreas() {
      const { data } = await supabase
        .from("areas")
        .select("*")
        .order("sort_order");
      
      if (data) {
        setAreas(data as Area[]);
      }
    }

    loadAreas();
  }, [refreshKey]); // Chạy lại mỗi khi refreshKey thay đổi

  // --- HÀM CẬP NHẬT TRẠNG THÁI BẬT/TẮT ---
  const handleToggleActive = async (areaId: number, currentStatus: boolean) => {
    // Cập nhật UI ngay lập tức cho mượt
    setAreas((prev) =>
      prev.map((a) => (a.id === areaId ? { ...a, is_active: !currentStatus } : a))
    );

    // Bắn lệnh xuống Supabase để lưu lại
    const { error } = await supabase
      .from("areas")
      .update({ is_active: !currentStatus })
      .eq("id", areaId);

    if (error) {
      alert("Lỗi cập nhật: " + error.message);
      // Thay vì gọi hàm, ta chỉ cần "bóp cò" để useEffect tự động tải lại data cũ
      setRefreshKey((prev) => prev + 1);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[80vh]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Danh sách khu vực
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý và đóng/mở khu vực chỗ ngồi
          </p>
        </div>
        <button className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition">
          + Thêm khu vực
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl py-4 px-6 grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase mb-3">
        <div className="col-span-2">Viết tắt</div>
        <div className="col-span-5">Tên khu vực</div>
        <div className="col-span-2 text-center">Thứ tự</div>
        <div className="col-span-3 text-right pr-4">Trạng thái</div>
      </div>

      <div className="space-y-3">
        {areas.map((area) => (
          <div
            key={area.id}
            className={`border rounded-xl p-3 grid grid-cols-12 gap-4 items-center shadow-sm transition-colors ${
              area.is_active ? "bg-white border-gray-100" : "bg-gray-50 border-gray-200 opacity-80"
            }`}
          >
            <div className="col-span-2">
              <div className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg text-center w-16">
                {area.code}
              </div>
            </div>
            <div className="col-span-5">
              <div className={`font-bold py-2 px-4 rounded-lg ${area.is_active ? "bg-gray-800 text-white" : "bg-gray-300 text-gray-600"}`}>
                {area.name}
              </div>
            </div>
            <div className="col-span-2 flex justify-center">
              <div className="bg-gray-100 text-gray-600 font-bold py-2 px-4 rounded-lg w-16 text-center border border-gray-200">
                {area.sort_order}
              </div>
            </div>
            
            {/* CỘT TRẠNG THÁI CÓ THỂ CLICK */}
            <div className="col-span-3 flex justify-end items-center gap-4 pr-2">
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => handleToggleActive(area.id, area.is_active)}
              >
                <div
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex items-center ${
                    area.is_active ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                      area.is_active ? "translate-x-5" : "translate-x-0"
                    }`}
                  ></div>
                </div>
                <span className={`text-xs font-bold w-24 ${area.is_active ? "text-green-600" : "text-gray-400"}`}>
                  {area.is_active ? "Đang hoạt động" : "Đã tạm dừng"}
                </span>
              </div>
              
              <button className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50">
                🗑
              </button>
            </div>
          </div>
        ))}

        {areas.length === 0 && (
          <div className="text-center py-10 text-gray-400 font-medium">
            Chưa có khu vực nào. Hãy thêm mới!
          </div>
        )}
      </div>
    </div>
  );
}