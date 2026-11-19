import { auth } from "@/auth";
import { getFassungHtml, getPage } from "@/lib/pages";
import { withPrintCss } from "@/lib/print";
import { withCoach } from "@/lib/coach-embed";
import { coachAllowedFor, COACH_NAME } from "@/lib/coach";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Nicht angemeldet.", { status: 401 });
  const { id } = await params;
  const page = await getPage(Number(id), Number(session.user.id), session.user.role === "admin");
  if (!page) return new Response("Nicht gefunden.", { status: 404 });
  const sp = new URL(req.url).searchParams;
  const download = sp.get("download") === "1";
  const slug = page.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "lernseite";
  // ?fassung=ID: eine andere Fassung aus dem Nachbessern ansehen (nur Besitzerin oder Admin)
  const fassungId = Number(sp.get("fassung") ?? 0);
  const canEdit = page.user_id === Number(session.user.id) || session.user.role === "admin";
  const fassung = fassungId > 0 && canEdit ? await getFassungHtml(page.id, fassungId) : null;
  if (fassungId > 0 && !fassung) return new Response("Fassung nicht gefunden.", { status: 404 });
  let html = withPrintCss(fassung ?? page.html);
  // Vorschau fuer die Lehrperson: Coach wie beim Freigabelink einblenden (nicht beim Download, offline kein Coach)
  if (!download && page.coach && page.owner_coach && page.share_token && coachAllowedFor(page)) html = withCoach(html, page.share_token, COACH_NAME);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      ...(download ? { "Content-Disposition": `attachment; filename="${slug}.html"` } : {}),
    },
  });
}
