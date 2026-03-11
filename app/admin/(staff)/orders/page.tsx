"use client";

import { useEffect, useState, useCallback } from "react";
import OrdersHeader from "./OrdersHeader";
import OrdersCard from "./OrdersCard";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

export type OrderStatus = "PENDING" | "CONFIRMED" | "AWAIT_PAYMENT" | "DONE";

export type OrderUI = {
  id: number;
  code: string;
  tableCode: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  customer_name: string;
  paymentMethod?: "CASH" | "CK" | null;
  orderType: "DINE_IN" | "TAKEAWAY";
  note?: string | null;
  items: {
    food_id: number;
    food_name: string;
    quantity: number;
    price: number;
    image_url?: string | null;
  }[];
};

// Kiểu dữ liệu thô trả về từ bảng order_items
type RawOrderItem = {
  food_id: number;
  food_name?: string;
  quantity: number;
  price: number;
  foods?: {
    name: string;
    image_url?: string;
  };
};

// Kiểu dữ liệu thô trả về từ bảng orders sau khi join
type RawOrder = {
  id: number;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  customer_name?: string;
  order_type?: "DINE_IN" | "TAKEAWAY";
  note?: string | null;
  daily_number?: number;
  tables?: { code: string } | null;
  order_items?: RawOrderItem[];
  payments?: { method: "CASH" | "CK" } | { method: "CASH" | "CK" }[] | null;
};

type Tab = "pending" | "confirmed" | "await_payment" | "done";

const TAB_TO_STATUS: Record<Tab, OrderStatus[]> = {
  pending: ["PENDING"],
  confirmed: ["CONFIRMED"],
  await_payment: ["AWAIT_PAYMENT"],
  done: ["DONE"],
};

/* ================= PAGE ================= */

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [orders, setOrders] = useState<OrderUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<Tab, number>>({
    pending: 0,
    confirmed: 0,
    await_payment: 0,
    done: 0,
  });

  // --- HÀM TẢI DANH SÁCH ĐƠN (FETCH ORDERS) ---
  const fetchOrders = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id, status, total_amount, created_at, customer_name,
        order_type, note, daily_number,
        tables:table_id ( code ),
        order_items (
          food_id,
          quantity,
          price,
          food_name, 
          foods ( name, image_url )
        ),
        payments ( method )
      `
      )
      .in("status", TAB_TO_STATUS[tab])
      .order("created_at", { ascending: tab != "done" });

    if (!error) {
      // Ép kiểu an toàn bằng as unknown as RawOrder[]
      const mapped: OrderUI[] = ((data as unknown) as RawOrder[] ?? []).map((o) => {
        
        // Xử lý Payment an toàn
        let method = null;
        if (Array.isArray(o.payments) && o.payments.length > 0) {
          method = o.payments[0].method;
        } else if (o.payments && !Array.isArray(o.payments)) {
          method = o.payments.method;
        }

        // Lấy dữ liệu Table (trích xuất phần tử đầu tiên nếu nó là mảng)
        const tableData = Array.isArray(o.tables) ? o.tables[0] : o.tables;

        const dateObj = new Date(o.created_at);
        const dd = dateObj.getDate().toString().padStart(2, "0");
        const mm = (dateObj.getMonth() + 1).toString().padStart(2, "0");
        const yyyy = dateObj.getFullYear().toString();
        const orderSeq = (o.daily_number || o.id).toString().padStart(4, "0");

        // Ghép chuỗi code theo format: #00000000000000
        const orderCode = `#${dd}${mm}${yyyy}${orderSeq}`;

        return {
          id: o.id,
          code: orderCode,
          tableCode: tableData?.code ?? "—",
          status: o.status,
          total_amount: o.total_amount,
          created_at: o.created_at,
          customer_name: o.customer_name || "Vãng lai",
          paymentMethod: method as "CASH" | "CK" | null,
          orderType: o.order_type || "DINE_IN",
          note: o.note,

          // 3. Lấy dữ liệu Order Items
          items: o.order_items?.map((item) => {
            // Lấy dữ liệu Food (trích xuất phần tử đầu tiên nếu nó là mảng)
            const foodData = Array.isArray(item.foods) ? item.foods[0] : item.foods;
            
            return {
              food_id: item.food_id,
              food_name: item.food_name || foodData?.name || "Món không tên", // <-- Lỗi đỏ đã được sửa ở đây
              quantity: item.quantity,
              price: item.price,
              image_url: foodData?.image_url, // <-- Lỗi đỏ đã được sửa ở đây
            };
          }) || [],
        };
      });
      setOrders(mapped);
    } else {
      console.error("Lỗi tải đơn:", error);
      setOrders([]);
    }
    setLoading(false);
  }, [tab]);

  // --- HÀM ĐẾM SỐ LƯỢNG ---
  const fetchCounts = useCallback(async () => {
    const [p, c, a, d] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "CONFIRMED"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "AWAIT_PAYMENT"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "DONE"),
    ]);

    setCounts({
      pending: p.count || 0,
      confirmed: c.count || 0,
      await_payment: a.count || 0,
      done: d.count || 0,
    });
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchCounts();

    const channel = supabase
      .channel("orders_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, fetchCounts]);

  // --- CÁC HÀM ACTION ---
  async function updateStatus(id: number, status: OrderStatus) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (!error) {
      fetchOrders();
      fetchCounts();
    }
  }

  async function handlePayment(order: OrderUI, method: "CASH" | "CK") {
    try {
      if (method === "CK") {
        alert(`🖨️ In hóa đơn QR (Chuyển khoản) - Bàn ${order.tableCode}`);
      } else {
        alert(`🖨️ In hóa đơn thường (Tiền mặt) - Bàn ${order.tableCode}`);
      }

      const { error: payError } = await supabase.from("payments").insert({
        order_id: order.id,
        amount: order.total_amount,
        method: method,
        paid_at: new Date().toISOString(),
      });
      if (payError) throw payError;

      await updateStatus(order.id, "DONE");
    } catch (err: unknown) {
      const error = err as Error;
      alert("Lỗi thanh toán: " + error.message);
    }
  }

  async function deleteOrder(id: number) {
    if (confirm("Bạn có chắc muốn XÓA VĨNH VIỄN đơn này?")) {
      await supabase.from("order_items").delete().eq("order_id", id);
      await supabase.from("orders").delete().eq("id", id);
      fetchOrders();
      fetchCounts();
    }
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <OrdersHeader activeTab={tab} counts={counts} onChange={setTab} />

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading && (
          <div className="col-span-full text-center text-gray-500 py-10">
            Đang tải dữ liệu...
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center text-gray-400 mt-20">
            <div className="text-4xl mb-2">📭</div>
            <p>Không có đơn hàng nào ở trạng thái này</p>
          </div>
        )}

        {orders.map((order) => (
          <OrdersCard
            key={order.id}
            order={order}
            onNextStep={() => {
              if (order.status === "PENDING")
                updateStatus(order.id, "CONFIRMED");
              else if (order.status === "CONFIRMED")
                updateStatus(order.id, "AWAIT_PAYMENT");
            }}
            onPayment={(method) => handlePayment(order, method)}
            onDelete={() => deleteOrder(order.id)}
            onRefresh={() => {
              fetchOrders();
              fetchCounts();
            }}
          />
        ))}
      </div>
    </div>
  );
}
