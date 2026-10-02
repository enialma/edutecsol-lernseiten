import { auth } from "@/auth";
import { lernseiteToDocx } from "@/lib/docx";
import { getPage } from "@/lib/pages";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Nicht angemeldet.", { status: 401 });
  const { id } = await params;
  const page = await getPage(Number(id), Number(session.user.id), session.user.role === "admin");
  if (!page) return new Response("Nicht gefunden.", { status: 404 });
  const buf = await lernseiteToDocx(page.html, { title: page.title, fach: page.fach, stufe: page.stufe, created: page.created_at });
  const slug = page.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "lernseite";
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slug}.docx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
