"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AreasPage() {
  const [areas, setAreas] = useState<any[]>([]);

  useEffect(() => {
    fetchAreas();
  }, []);

  async function fetchAreas() {
    const { data } = await supabase
      .from("areas")
      .select("*")
      .order("sort_order");
    if (data) setAreas(data);
  }

  // Hàm demo: Lưu hoặc Xóa bạn tự thêm logic tương tự categories nhé

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Danh sách khu vực
          </h1>
          <p className="text-gray-500 text-sm">Phân loại khu vực chỗ ngồi</p>
        </div>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700">
          + Thêm khu vực
        </button>
      </div>

      <div className="bg-gray-50 rounded-t-lg py-3 px-6 grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase">
        <div className="col-span-2">Viết tắt</div>
        <div className="col-span-5">Tên khu vực</div>
        <div className="col-span-2">Thứ tự</div>
        <div className="col-span-3">Trạng thái</div>
      </div>

      <div className="space-y-3 mt-3">
        {areas.map((area) => (
          <div
            key={area.id}
            className="bg-white border border-gray-100 rounded-xl p-3 grid grid-cols-12 gap-4 items-center shadow-sm"
          >
            <div className="col-span-2">
              <div className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg text-center w-16">
                {area.code}
              </div>
            </div>
            <div className="col-span-5">
              <div className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg">
                {area.name}
              </div>
            </div>
            <div className="col-span-2">
              <div className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg w-16 text-center">
                {area.sort_order}
              </div>
            </div>
            <div className="col-span-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-5 rounded-full p-1 cursor-pointer transition ${
                    area.is_active ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-3 h-3 bg-white rounded-full shadow-md transform transition ${
                      area.is_active ? "translate-x-5" : ""
                    }`}
                  ></div>
                </div>
                <span className="text-xs font-bold text-gray-600">
                  {area.is_active ? "Đang hoạt động" : "Tắt"}
                </span>
              </div>
              <button className="text-gray-400 hover:text-red-500">🗑</button>
            </div>
          </div>
        ))}

        {areas.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            Chưa có khu vực nào. Hãy thêm mới!
          </div>
        )}
      </div>
    </div>
  );
}
