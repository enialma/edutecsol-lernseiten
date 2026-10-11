// Liefert das Bild (angemeldet). ?download=1 erzwingt das Speichern.
import { auth } from "@/auth";
import { getImage } from "@/lib/images";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Nicht angemeldet.", { status: 401 });
  const { id } = await params;
  const img = await getImage(Number(id), Number(session.user.id), session.user.role === "admin");
  if (!img) return new Response("Nicht gefunden.", { status: 404 });
  const download = new URL(req.url).searchParams.get("download") === "1";
  const ext = img.mime === "image/png" ? "png" : "jpg";
  const slug = img.title.toLowerCase().replace(/[^a-z0-9äöü]+/g, "-").replace(/^-|-$/g, "") || "bild";
  return new Response(Buffer.from(img.data_b64, "base64"), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "private, max-age=3600",
      ...(download ? { "Content-Disposition": `attachment; filename="${slug}-${img.id}.${ext}"` } : {}),
    },
  });
}
