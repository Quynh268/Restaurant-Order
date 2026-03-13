import Link from "next/link";

export default function Footer() {
  return (
    <div className="px-4 py-6 text-center text-xs text-gray-400">
      <div>© 2025 SmartMenu System.</div>
      <div className="italic mt-1">
        Ứng dụng hỗ trợ đặt món nhanh chóng & chuyên nghiệp.
      </div>
      <div className="mt-3">
        <Link 
          href="/admin/login" 
          className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors px-4 py-2"
        >
          Khu vực nội bộ
        </Link>
      </div>
    </div>
  );
}
