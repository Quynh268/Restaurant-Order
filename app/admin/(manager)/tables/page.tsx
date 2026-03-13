"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import QRModal from "./QRModal";

type Area = {
  id: number;
  code: string; 
  name: string;
};

type TableUI = {
  id: number;
  code: string;
  name: string;
  area_id: number;
  index_number?: number;
  areas?: { name: string } | null;
};

export default function TablesPage() {
  const [tables, setTables] = useState<TableUI[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [filterArea, setFilterArea] = useState<number | "ALL">("ALL");

  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newTable, setNewTable] = useState({
    quantity: 1, 
    area_id: 0,
  });

  const fetchData = () => {
    Promise.all([
      supabase.from("tables").select("*, areas(name)").order("index_number"),
      supabase.from("areas").select("*"),
    ]).then(([resTable, resArea]) => {
      if (resTable.data) setTables(resTable.data as TableUI[]);
      if (resArea.data) setAreas(resArea.data as Area[]);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTables =
    filterArea === "ALL"
      ? tables
      : tables.filter((t) => t.area_id === filterArea);

  const handleToggleTable = (id: number) => {
    setSelectedTableIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTableIds.length === filteredTables.length) {
      setSelectedTableIds([]);
    } else {
      setSelectedTableIds(filteredTables.map((t) => t.id));
    }
  };

  const selectedTablesData = tables.filter((t) =>
    selectedTableIds.includes(t.id)
  );

  const handleOpenAddModal = () => {
    const defaultAreaId = areas.length > 0 ? areas[0].id : 0;
    setNewTable({
      quantity: 1,
      area_id: defaultAreaId,
    });
    setIsAddModalOpen(true);
  };

  // --- LOGIC LẤP CHỖ TRỐNG THÔNG MINH ---
  const currentPrefix = areas.find((a) => a.id === newTable.area_id)?.code || "A";
  const formatNumber = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const existingNumbers = tables
    .filter((t) => t.area_id === newTable.area_id && t.code.startsWith(currentPrefix.toUpperCase()))
    .map((t) => parseInt(t.code.replace(currentPrefix.toUpperCase(), ""), 10))
    .filter((n) => !isNaN(n));

  const getNextAvailableNumbers = (count: number) => {
    const availableNumbers = [];
    let currentNum = 1;
    while (availableNumbers.length < count) {
      if (!existingNumbers.includes(currentNum)) {
        availableNumbers.push(currentNum);
      }
      currentNum++;
    }
    return availableNumbers;
  };

  const nextNumbersToCreate = getNextAvailableNumbers(newTable.quantity);
  
  // TẠO DANH SÁCH MÃ BÀN ĐỂ HIỂN THỊ PREVIEW
  const generatedCodes = nextNumbersToCreate.map(
    (num) => `${currentPrefix.toUpperCase()}${formatNumber(num)}`
  );

  const handleSaveNewTable = async () => {
    if (newTable.quantity < 1) return alert("Số lượng bàn phải lớn hơn 0.");
    if (!newTable.area_id) return alert("Vui lòng chọn khu vực.");

    setIsSaving(true);
    try {
      const maxIndex = tables.length > 0 ? Math.max(...tables.map((t) => t.index_number || 0)) : 0;

      const newTablesToInsert = nextNumbersToCreate.map((num, index) => {
        const tableCode = `${currentPrefix.toUpperCase()}${formatNumber(num)}`;
        return {
          code: tableCode,
          name: `Bàn ${tableCode}`,
          area_id: newTable.area_id,
          index_number: maxIndex + index + 1,
        };
      });

      const { error } = await supabase.from("tables").insert(newTablesToInsert);
      if (error) throw error;

      alert(`Đã tạo thành công ${newTable.quantity} bàn mới!`);
      setIsAddModalOpen(false);
      fetchData(); 
    } catch (error) {
      const err = error as Error;
      alert("Lỗi khi thêm bàn: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSingleTable = async (e: React.MouseEvent, tableId: number, tableCode: string) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN Bàn ${tableCode}?`)) return;

    try {
      const { error } = await supabase.from("tables").delete().eq("id", tableId);
      if (error) throw error;
      alert(`Đã xóa sạch Bàn ${tableCode}!`);
      setSelectedTableIds((prev) => prev.filter((id) => id !== tableId));
      fetchData();
    } catch (error) {
      const err = error as Error;
      if (err.message.includes("foreign key") || err.message.includes("violates")) {
        alert(`❌ KHÔNG THỂ XÓA Bàn ${tableCode} vì đã có hóa đơn lịch sử!`);
      } else {
        alert("Lỗi khi xóa bàn: " + err.message);
      }
    }
  };

  const handleDeleteSelectedTables = async () => {
    if (!window.confirm(`⚠️ NGUY HIỂM: Bạn có chắc muốn XÓA ${selectedTableIds.length} BÀN đang chọn không?`)) return;

    try {
      const { error } = await supabase.from("tables").delete().in("id", selectedTableIds);
      if (error) throw error;
      
      alert(`Đã xóa thành công ${selectedTableIds.length} bàn!`);
      setSelectedTableIds([]); 
      fetchData();
    } catch (error) {
      const err = error as Error;
      if (err.message.includes("foreign key") || err.message.includes("violates")) {
        alert(`❌ LỖI: Trong số các bàn được chọn có bàn đã dính hóa đơn lịch sử. Hệ thống đã từ chối lệnh xóa hàng loạt để bảo vệ dữ liệu!`);
      } else {
        alert("Lỗi khi xóa bàn: " + err.message);
      }
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[80vh] relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh sách bàn</h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý sơ đồ và in mã QR cho khách
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDeleteSelectedTables}
            disabled={selectedTableIds.length === 0}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition border
              ${
                selectedTableIds.length > 0
                  ? "bg-white border-red-500 text-red-600 hover:bg-red-50 shadow-sm cursor-pointer"
                  : "bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed hidden"
              }
            `}
          >
            <span>🗑️</span> Xóa {selectedTableIds.length} bàn
          </button>

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
            {selectedTableIds.length > 0 ? `In ${selectedTableIds.length} QR` : "In mã QR"}
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition"
          >
            + Thêm bàn hàng loạt
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            placeholder="Tìm kiếm mã bàn..."
            className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition placeholder:text-gray-400 text-gray-900"
          />
        </div>

        <button
          onClick={handleSelectAll}
          className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition text-sm whitespace-nowrap"
        >
          {selectedTableIds.length === filteredTables.length && filteredTables.length > 0
            ? "Bỏ chọn tất cả"
            : "Chọn tất cả"}
        </button>

        <select
          className="bg-gray-50 border border-gray-200 text-gray-900 px-5 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[200px]"
          onChange={(e) => {
            setFilterArea(e.target.value === "ALL" ? "ALL" : Number(e.target.value));
            setSelectedTableIds([]);
          }}
        >
          <option value="ALL">Tất cả khu vực</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

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
              <button
                onClick={(e) => handleDeleteSingleTable(e, table.id, table.code)}
                className="absolute top-2 left-2 w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-20"
                title="Xóa bàn này"
              >
                <span className="text-[10px]">🗑️</span>
              </button>

              {isSelected && (
                <div className="absolute top-2 right-2 text-[10px] bg-orange-600 text-white w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-scale-in z-20">
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

              <div className="text-center mt-1">
                <div className="text-xs font-medium text-gray-400">
                  {table.areas?.name || "Chưa phân khu"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <QRModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} tables={selectedTablesData} />

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Thêm bàn nhanh</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Khu vực</label>
                <select
                  value={newTable.area_id}
                  onChange={(e) => setNewTable({ ...newTable, area_id: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Số lượng bàn cần thêm</label>
                <input
                  type="number"
                  min="1"
                  value={newTable.quantity}
                  onChange={(e) => setNewTable({ ...newTable, quantity: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
              </div>

              {/* BẢN XEM TRƯỚC SANG XỊN MỊN */}
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
                <div className="text-2xl mt-0.5">✨</div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-orange-600 uppercase mb-2">Các bàn sẽ được tạo:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedCodes.length === 0 ? (
                      <span className="text-sm text-gray-500 italic">Hãy nhập số lượng lớn hơn 0</span>
                    ) : (
                      generatedCodes.map((code) => (
                        <span key={code} className="bg-white border border-orange-200 text-orange-800 px-2 py-1 rounded-md text-sm font-black shadow-sm">
                          {code}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition">Hủy</button>
              <button onClick={handleSaveNewTable} disabled={isSaving} className="flex-1 py-3 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 transition">
                {isSaving ? "Đang xử lý..." : "Tạo bàn ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}