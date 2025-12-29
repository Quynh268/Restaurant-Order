"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [filterArea, setFilterArea] = useState<number | "ALL">("ALL");

  useEffect(() => {
    Promise.all([
      supabase.from("tables").select("*, areas(name)").order("index_number"),
      supabase.from("areas").select("*"),
    ]).then(([resTable, resArea]) => {
      if (resTable.data) setTables(resTable.data);
      if (resArea.data) setAreas(resArea.data);
    });
  }, []);

  const filteredTables =
    filterArea === "ALL"
      ? tables
      : tables.filter((t) => t.area_id === filterArea);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh sách bàn</h1>
          <p className="text-gray-500 text-sm">Quản lý và thiết lập mã QR</p>
        </div>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700">
          + Thêm bàn mới
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        <input
          placeholder="🔍 Tìm kiếm mã bàn..."
          className="flex-1 bg-gray-800 text-white px-4 py-2.5 rounded-lg placeholder:text-gray-500 focus:outline-none"
        />
        <select
          className="bg-gray-800 text-white px-4 py-2.5 rounded-lg font-bold focus:outline-none min-w-[150px]"
          onChange={(e) =>
            setFilterArea(
              e.target.value === "ALL" ? "ALL" : Number(e.target.value)
            )
          }
        >
          <option value="ALL">Tất cả khu vực</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid Tables */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredTables.map((table) => (
          <div
            key={table.id}
            className="border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition cursor-pointer bg-white group"
          >
            <div className="bg-gray-50 group-hover:bg-orange-50 w-16 h-16 rounded-lg flex items-center justify-center text-xl font-black text-gray-800 group-hover:text-orange-600 transition">
              {table.code}
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-800 text-sm">
                {table.name}
              </div>
              <div className="text-xs text-gray-400">
                {table.areas?.name || "Chưa phân khu"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
