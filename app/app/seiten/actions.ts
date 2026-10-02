"use server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { deletePage } from "@/lib/pages";

export async function deletePageAction(fd: FormData) {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Nicht angemeldet.");
  await deletePage(Number(fd.get("id")), Number(s.user.id), s.user.role === "admin");
  redirect("/app/seiten");
}
