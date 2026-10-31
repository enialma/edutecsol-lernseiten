"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { addPagesToGruppe, createGruppe, deleteGruppe, removePageFromGruppe, setGruppeShare, updateGruppe } from "@/lib/gruppen";
import { setShare } from "@/lib/pages";

async function who() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Nicht angemeldet.");
  return { userId: Number(s.user.id), isAdmin: s.user.role === "admin" };
}

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
const ids = (fd: FormData, key: string) => fd.getAll(key).map(Number).filter((n) => Number.isInteger(n) && n > 0);

export async function createGruppeAction(fd: FormData) {
  const { userId } = await who();
  const name = clean(fd.get("name"), 80);
  if (!name) return;
  const beschreibung = clean(fd.get("beschreibung"), 300) || null;
  const id = await createGruppe(userId, name, beschreibung);
  revalidatePath("/app/gruppen");
  redirect(`/app/gruppen/${id}`);
}

export async function updateGruppeAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const id = Number(fd.get("id"));
  const name = clean(fd.get("name"), 80);
  if (!name) return;
  await updateGruppe(id, userId, isAdmin, { name, beschreibung: clean(fd.get("beschreibung"), 300) || null });
  revalidatePath(`/app/gruppen/${id}`);
  revalidatePath("/app/gruppen");
}

export async function deleteGruppeAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  await deleteGruppe(Number(fd.get("id")), userId, isAdmin);
  revalidatePath("/app/gruppen");
  revalidatePath("/app/seiten");
  redirect("/app/gruppen");
}

export async function gruppeShareAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const id = Number(fd.get("id"));
  await setGruppeShare(id, userId, isAdmin, fd.get("on") === "1");
  revalidatePath(`/app/gruppen/${id}`);
  revalidatePath("/app/gruppen");
}

export async function addPagesAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const id = Number(fd.get("id"));
  await addPagesToGruppe(id, userId, isAdmin, ids(fd, "seite"));
  revalidatePath(`/app/gruppen/${id}`);
  revalidatePath("/app/gruppen");
  revalidatePath("/app/seiten");
}

export async function removePageAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const id = Number(fd.get("id"));
  await removePageFromGruppe(id, Number(fd.get("seite")), userId, isAdmin);
  revalidatePath(`/app/gruppen/${id}`);
  revalidatePath("/app/gruppen");
  revalidatePath("/app/seiten");
}

/** Freigabelink einer Seite direkt aus der Gruppenansicht erstellen, damit sie auf der Klassenseite erscheint. */
export async function sharePageFromGruppeAction(fd: FormData) {
  const { userId, isAdmin } = await who();
  const id = Number(fd.get("id"));
  const seite = Number(fd.get("seite"));
  await setShare(seite, userId, isAdmin, true);
  revalidatePath(`/app/gruppen/${id}`);
  revalidatePath(`/app/seiten/${seite}`);
}
