"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import QRModal from "./QRModal";

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [filterArea, setFilterArea] = useState<number | "ALL">("ALL");

  // --- STATE CHỌN NHIỀU BÀN ---
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    Promise.all([
      supabase.from("tables").select("*, areas(name)").order("index_number"),
      supabase.from("areas").select("*"),
    ]).then(([resTable, resArea]) => {
      if (resTable.data) setTables(resTable.data);
      if (resArea.data) setAreas(resArea.data);
    });
  };

  const filteredTables =
    filterArea === "ALL"
      ? tables
      : tables.filter((t) => t.area_id === filterArea);

  // --- LOGIC CHỌN NHIỀU ---
  const handleToggleTable = (id: number) => {
    setSelectedTableIds(
      (prev) =>
        prev.includes(id)
          ? prev.filter((item) => item !== id) // Nếu có rồi thì bỏ chọn
          : [...prev, id] // Chưa có thì thêm vào
    );
  };

  const handleSelectAll = () => {
    if (selectedTableIds.length === filteredTables.length) {
      setSelectedTableIds([]); // Bỏ chọn hết
    } else {
      setSelectedTableIds(filteredTables.map((t) => t.id)); // Chọn hết danh sách đang lọc
    }
  };

  // Lấy danh sách object các bàn đã chọn để truyền vào Modal
  const selectedTablesData = tables.filter((t) =>
    selectedTableIds.includes(t.id)
  );

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[80vh]">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh sách bàn</h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý sơ đồ và in mã QR cho khách
          </p>
        </div>

        <div className="flex gap-3">
          {/* NÚT IN QR: Hiển thị số lượng bàn đã chọn */}
          <button
            onClick={() => setIsQRModalOpen(true)}
            disabled={selectedTableIds.length === 0}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition border
              ${
                selectedTableIds.length > 0
                  ? "bg-white border-orange-500 text-orange-600 hover:bg-orange-50 shadow-sm cursor-pointer"
                  : "bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            <span>🖨️</span>
            {selectedTableIds.length > 0
              ? `In ${selectedTableIds.length} mã QR`
              : "In mã QR"}
          </button>

          <button className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition">
            + Thêm bàn mới
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            placeholder="Tìm kiếm mã bàn..."
            className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition placeholder:text-gray-400"
          />
        </div>

        {/* Nút Chọn tất cả */}
        <button
          onClick={handleSelectAll}
          className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition text-sm whitespace-nowrap"
        >
          {selectedTableIds.length === filteredTables.length &&
          filteredTables.length > 0
            ? "Bỏ chọn tất cả"
            : "Chọn tất cả"}
        </button>

        <select
          className="bg-gray-50 border border-gray-200 text-gray-700 px-5 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[200px]"
          onChange={(e) => {
            setFilterArea(
              e.target.value === "ALL" ? "ALL" : Number(e.target.value)
            );
            setSelectedTableIds([]); // Reset chọn khi đổi khu vực
          }}
        >
          <option value="ALL">Tất cả khu vực</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* GRID TABLES */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {filteredTables.map((table) => {
          const isSelected = selectedTableIds.includes(table.id);

          return (
            <div
              key={table.id}
              onClick={() => handleToggleTable(table.id)}
              className={`
                relative border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition cursor-pointer group select-none
                ${
                  isSelected
                    ? "border-orange-500 ring-2 ring-orange-500 ring-offset-2 bg-white shadow-md z-10"
                    : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-md"
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 text-[10px] bg-orange-600 text-white w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-scale-in">
                  ✓
                </div>
              )}

              <div
                className={`
                  w-16 h-16 rounded-lg flex items-center justify-center text-xl font-black transition
                  ${
                    isSelected
                      ? "bg-orange-50 text-orange-600"
                      : "bg-gray-50 text-gray-800 group-hover:bg-orange-50 group-hover:text-orange-600"
                  }
                `}
              >
                {table.code}
              </div>

              <div className="text-center">
                <div
                  className={`font-bold text-sm ${
                    isSelected ? "text-orange-800" : "text-gray-800"
                  }`}
                >
                  {table.name}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {table.areas?.name || "Chưa phân khu"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL IN QR */}
      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        tables={selectedTablesData} // Truyền danh sách bàn
      />
    </div>
  );
}
