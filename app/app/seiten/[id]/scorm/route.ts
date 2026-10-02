import { auth } from "@/auth";
import { getPage } from "@/lib/pages";
import { lernseiteToScorm } from "@/lib/scorm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Nicht angemeldet.", { status: 401 });
  const { id } = await params;
  const page = await getPage(Number(id), Number(session.user.id), session.user.role === "admin");
  if (!page) return new Response("Nicht gefunden.", { status: 404 });
  const buf = await lernseiteToScorm(page.html, { id: page.id, title: page.title });
  const slug = page.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "lernseite";
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}-scorm.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
