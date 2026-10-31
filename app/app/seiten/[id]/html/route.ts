import { auth } from "@/auth";
import { getPage } from "@/lib/pages";
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
  const download = new URL(req.url).searchParams.get("download") === "1";
  const slug = page.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "lernseite";
  let html = withPrintCss(page.html);
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
