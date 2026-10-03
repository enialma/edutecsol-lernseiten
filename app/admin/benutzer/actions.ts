"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createInstitution, createUser, deleteInstitution, deleteUser, renameInstitution, setActive, setInstitution, setPassword } from "@/lib/users";

async function requireAdmin() {
  const s = await auth();
  if (s?.user?.role !== "admin") throw new Error("Nur für Admins.");
  return s;
}
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function createUserAction(fd: FormData) {
  await requireAdmin();
  const email = str(fd, "email");
  if (!email) return;
  try {
    await createUser({
      email,
      name: str(fd, "name"),
      institutionId: Number(fd.get("institution_id")) || null,
      notes: str(fd, "notes"),
      role: str(fd, "role") === "admin" ? "admin" : "user",
      valid_until: str(fd, "valid_until") || undefined,
      password: str(fd, "password") || undefined,
    });
  } catch (e) {
    console.error("createUser fehlgeschlagen", e);
  }
  revalidatePath("/admin/benutzer");
}

export async function setInstitutionAction(fd: FormData) {
  await requireAdmin();
  await setInstitution(Number(fd.get("id")), Number(fd.get("institution_id")) || null);
  revalidatePath("/admin/benutzer");
}

export async function createInstitutionAction(fd: FormData) {
  await requireAdmin();
  const name = str(fd, "name");
  if (name) await createInstitution(name);
  revalidatePath("/admin/benutzer");
}

export async function renameInstitutionAction(fd: FormData) {
  await requireAdmin();
  const name = str(fd, "name");
  try {
    if (name) await renameInstitution(Number(fd.get("id")), name);
  } catch (e) {
    console.error("renameInstitution fehlgeschlagen", e); // z. B. Name schon vergeben
  }
  revalidatePath("/admin/benutzer");
}

export async function deleteInstitutionAction(fd: FormData) {
  await requireAdmin();
  await deleteInstitution(Number(fd.get("id")));
  revalidatePath("/admin/benutzer");
}

export async function toggleActiveAction(fd: FormData) {
  await requireAdmin();
  await setActive(Number(fd.get("id")), fd.get("active") === "1");
  revalidatePath("/admin/benutzer");
}

export async function setPasswordAction(fd: FormData) {
  await requireAdmin();
  const pw = str(fd, "password");
  if (pw.length < 8) return;
  await setPassword(Number(fd.get("id")), pw);
  revalidatePath("/admin/benutzer");
}

export async function deleteUserAction(fd: FormData) {
  const s = await requireAdmin();
  const id = Number(fd.get("id"));
  if (String(id) === s.user.id) return; // sich selbst nicht löschen
  await deleteUser(id);
  revalidatePath("/admin/benutzer");
}
