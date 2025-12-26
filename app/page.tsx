import { redirect } from "next/navigation";

export default function Home() {
  redirect("/order?table=A01");
}
