"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { importBeispiele } from "@/lib/beispiele";
import { deletePage, duplicatePage, setShare, setVisibility, updateTitle } from "@/lib/pages";

async function who() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Nicht angemeldet.");
  return { userId: Number(s.user.id), isAdmin: s.user.role === "admin" };
}

export async function deletePageAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  await deletePage(Number(fd.get("id")), userId, isAdmin);
  redirect("/app/seiten");
}

export async function shareAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const id = Number(fd.get("id"));
  await setShare(id, userId, isAdmin, fd.get("on") === "1");
  revalidatePath(`/app/seiten/${id}`);
}

export async function visibilityAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const id = Number(fd.get("id"));
  const v = fd.get("v");
  await setVisibility(id, userId, isAdmin, v === "all" ? "all" : v === "school" ? "school" : "private");
  revalidatePath(`/app/seiten/${id}`);
  revalidatePath("/app/seiten");
}

export async function renameAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const id = Number(fd.get("id"));
  const title = String(fd.get("title") ?? "").trim();
  if (title) await updateTitle(id, userId, isAdmin, title);
  revalidatePath(`/app/seiten/${id}`);
}

export async function importBeispieleAction() {
  const { userId, isAdmin } = await who();
  if (!isAdmin) throw new Error("Nur für Admins.");
  const h = await headers();
  await importBeispiele(userId, `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`);
  revalidatePath("/app/seiten");
}

export async function copyAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const newId = await duplicatePage(Number(fd.get("id")), userId, isAdmin);
  if (newId) redirect(`/app/seiten/${newId}`);
}
