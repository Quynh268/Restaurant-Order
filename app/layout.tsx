import { CartProvider } from "@/app/context/CartContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
