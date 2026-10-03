"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPage, setShare } from "@/lib/pages";
import { deleteMoodleLink, moodleCreateUrl, moodleSections, normalizeBase, parseCourseId, saveMoodleLink, type MoodleSection } from "@/lib/moodle";

async function who() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Nicht angemeldet.");
  return { userId: Number(s.user.id), isAdmin: s.user.role === "admin" };
}

const msg = (e: unknown) => (e instanceof Error ? e.message : "Unbekannter Fehler.");

export async function saveMoodleAction(address: string, token: string): Promise<{ base?: string; error?: string }> {
  try {
    const { userId } = await who();
    const t = token.trim();
    if (!/^[A-Za-z0-9]{20,128}$/.test(t)) return { error: "Das sieht nicht nach einem Moodle-Token aus." };
    const base = normalizeBase(address);
    await saveMoodleLink(userId, base, t);
    return { base };
  } catch (e) { return { error: msg(e) }; }
}

export async function removeMoodleAction(): Promise<void> {
  const { userId } = await who();
  await deleteMoodleLink(userId);
}

export async function moodleSectionsAction(course: string): Promise<{ courseId?: number; sections?: MoodleSection[]; error?: string }> {
  try {
    const { userId } = await who();
    const courseId = parseCourseId(course);
    return { courseId, sections: await moodleSections(userId, courseId) };
  } catch (e) { return { error: msg(e) }; }
}

export async function moodleCreateAction(pageId: number, courseId: number, sectionnum: number, name: string): Promise<{ courseUrl?: string; error?: string }> {
  try {
    const { userId, isAdmin } = await who();
    const page = await getPage(pageId, userId, isAdmin);
    if (!page || !(isAdmin || page.user_id === userId)) return { error: "Diese Lernseite kannst du nicht in Moodle legen. Kopiere sie zuerst in deine Sammlung." };
    // Moodle verlinkt auf den Freigabelink – falls noch keiner besteht, jetzt erstellen
    const token = page.share_token ?? (await setShare(pageId, userId, isAdmin, true));
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
    const courseUrl = await moodleCreateUrl(userId, {
      courseId, sectionnum, name: name.trim() || page.title, url: `${origin}/s/${token}`,
      intro: "Differenzierte, interaktive Lernseite – wähle deinen Zugang und arbeite direkt im Browser.",
    });
    revalidatePath(`/app/seiten/${pageId}`);
    return { courseUrl };
  } catch (e) { return { error: msg(e) }; }
}
