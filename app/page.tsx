import { redirect } from "next/navigation";

export default function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const table = searchParams?.table;

  if (table) {
    redirect(`/order?table=${table}`);
  }

  redirect("/order?table=A01");
}
