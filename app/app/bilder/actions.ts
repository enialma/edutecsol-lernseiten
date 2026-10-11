"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { deleteImage, duplicateImage, renameImage, setImageExample, setImageShare, setImageVisibility } from "@/lib/images";

async function who() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Nicht angemeldet.");
  return { userId: Number(s.user.id), isAdmin: s.user.role === "admin" };
}

export async function deleteImageAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  await deleteImage(Number(fd.get("id")), userId, isAdmin);
  redirect("/app/bilder");
}

export async function shareImageAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const id = Number(fd.get("id"));
  await setImageShare(id, userId, isAdmin, fd.get("on") === "1");
  revalidatePath(`/app/bilder/${id}`);
}

export async function renameImageAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const id = Number(fd.get("id"));
  const title = String(fd.get("title") ?? "").trim();
  if (title) await renameImage(id, userId, isAdmin, title.slice(0, 120));
  revalidatePath(`/app/bilder/${id}`);
  revalidatePath("/app/bilder");
}

export async function visibilityImageAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const id = Number(fd.get("id"));
  const v = fd.get("v");
  await setImageVisibility(id, userId, isAdmin, v === "all" ? "all" : v === "school" ? "school" : "private");
  revalidatePath(`/app/bilder/${id}`);
  revalidatePath("/app/bilder");
}

export async function copyImageAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const newId = await duplicateImage(Number(fd.get("id")), userId, isAdmin);
  redirect(newId ? `/app/bilder/${newId}` : "/app/bilder");
}

export async function exampleImageAction(fd: FormData) {
  const { isAdmin } = await who();
  if (!isAdmin) throw new Error("Nur für Admins.");
  const id = Number(fd.get("id"));
  await setImageExample(id, fd.get("on") === "1");
  revalidatePath(`/app/bilder/${id}`);
}
