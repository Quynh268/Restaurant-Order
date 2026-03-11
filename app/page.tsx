import { redirect } from "next/navigation";

// --- Ko cho Next.js cache trang này ---
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const table = params?.table;

  if (table) {
    redirect(`/order?table=${table}`);
  }

  redirect("/order?table=A01");
}
