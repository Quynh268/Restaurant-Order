"use client";

import { useEffect, useState } from "react";

type TableData = {
  id: number;
  code: string;
  name?: string;
  area_id?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tables: TableData[]; // Nhận vào mảng các bàn
};

export default function QRModal({ isOpen, onClose, tables }: Props) {
  // Hàm tạo link QR
  const getQrUrl = (tableCode: string) => {
    if (typeof window === "undefined") return "";
    const orderingUrl = `${window.location.origin}/order?table=${tableCode}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      orderingUrl
    )}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || tables.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in print:p-0 print:bg-white print:fixed print:inset-0 print:z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-[500px] max-w-full flex flex-col max-h-[90vh] print:shadow-none print:w-full print:h-auto print:max-h-none print:rounded-none">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center print:hidden">
          <h2 className="text-lg font-bold text-gray-800">
            In {tables.length} mã QR
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* --- NỘI DUNG IN (Scroll được nếu danh sách dài) --- */}
        <div
          id="printable-area"
          className="p-6 overflow-y-auto bg-gray-50 print:bg-white print:p-0 print:overflow-visible"
        >
          {/* GRID LAYOUT: Để in đẹp trên A4, ta chia lưới */}
          <div className="grid grid-cols-1 gap-6 print:grid-cols-3 print:gap-3 print:w-full">
            {tables.map((table) => (
              <div
                key={table.id}
                // Bỏ h-[350px], làm viền mỏng hơn khi in, thu nhỏ padding
                className="break-inside-avoid border-4 border-orange-500 rounded-3xl p-4 flex flex-col items-center justify-between shadow-sm bg-white print:shadow-none print:border-2 print:border-black print:rounded-xl print:p-3"
              >
                {/* Tên quán - Thu nhỏ font chữ khi in */}
                <div className="uppercase font-black text-lg text-orange-600 tracking-widest print:text-black print:text-[11px]">
                  RESTAURANT ORDER
                </div>

                {/* QR Code - Giảm kích thước ảnh khi in xuống còn ~100px */}
                <div className="w-40 h-40 bg-gray-50 my-2 print:w-24 print:h-24 print:my-1.5 print:bg-white">
                  <img
                    src={getQrUrl(table.code)}
                    alt={`QR ${table.code}`}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>

                {/* Tên bàn */}
                <div className="text-center">
                  <div className="text-gray-400 text-[10px] font-bold uppercase mb-1 print:text-black print:text-[8px] print:mb-0.5">
                    Quét mã ngay để gọi món!
                  </div>
                  {/* Chữ BÀN thu nhỏ lại */}
                  <div className="text-3xl font-black text-gray-800 print:text-black print:text-lg">
                    BÀN {table.code}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2"
          >
            <span>🖨️</span> In ngay
          </button>
        </div>
      </div>

      {/* CSS IN ẤN */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 4mm; /* Chỉnh lề trang in */
          }
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
