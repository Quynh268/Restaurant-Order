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
  items: {
    food_name: string;
    quantity: number;
    price: number;
  }[];
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

  // --- FETCH ORDERS ---
  const fetchOrders = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total_amount,
        created_at,
        customer_name,
        tables:table_id ( code ),
        order_items (
          food_name, 
          quantity,
          price,
          foods ( name ) 
        )
      `
      )
      .in("status", TAB_TO_STATUS[tab])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Lỗi tải đơn:", error);
      setOrders([]);
    } else {
      const mapped: OrderUI[] = (data ?? []).map((o: any) => ({
        id: o.id,
        code: `#${o.id.toString().padStart(6, "0")}`,
        tableCode: o.tables?.code ?? "—",
        status: o.status,
        total_amount: o.total_amount,
        created_at: o.created_at,
        customer_name: o.customer_name || "Vãng lai",
        items:
          o.order_items?.map((item: any) => ({
            food_name: item.food_name || item.foods?.name || "Món không tên",
            quantity: item.quantity,
            price: item.price,
          })) || [],
      }));
      setOrders(mapped);
    }
    setLoading(false);
  }, [tab]);

  // --- FETCH COUNTS ---
  const fetchCounts = async () => {
    const [p, c, a, d] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING"),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "CONFIRMED"),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "AWAIT_PAYMENT"),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "DONE"),
    ]);

    setCounts({
      pending: p.count || 0,
      confirmed: c.count || 0,
      await_payment: a.count || 0,
      done: d.count || 0,
    });
  };

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
  }, [fetchOrders]);

  // --- UPDATE STATUS ---
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

  // --- XỬ LÝ THANH TOÁN & IN ẤN ---
  async function handlePayment(order: OrderUI, method: "CASH" | "CK") {
    try {
      // 1. Giả lập in hóa đơn (Sau này bạn thay bằng lệnh in thật)
      if (method === "CK") {
        alert(
          `🖨️ Đang in hóa đơn kèm QR Code (Chuyển khoản) cho bàn ${order.tableCode}...`
        );
      } else {
        alert(
          `🖨️ Đang in hóa đơn thường (Tiền mặt) cho bàn ${order.tableCode}...`
        );
      }

      // 2. Ghi nhận thanh toán vào DB
      const { error: payError } = await supabase.from("payments").insert({
        order_id: order.id,
        amount: order.total_amount,
        method: method, // 'CASH' hoặc 'CK'
        paid_at: new Date().toISOString(),
      });

      if (payError) throw payError;

      // 3. Hoàn thành đơn
      await updateStatus(order.id, "DONE");
    } catch (err: any) {
      alert("Lỗi thanh toán: " + err.message);
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
            // Truyền hàm thanh toán riêng
            onPayment={(method) => handlePayment(order, method)}
            onDelete={() => deleteOrder(order.id)}
          />
        ))}
      </div>
    </div>
  );
}
