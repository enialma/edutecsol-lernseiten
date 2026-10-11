// Öffentlicher Bildlink: Lernende, Moodle oder eine Lernseite laden das Bild ohne Login.
import { getImageByToken } from "@/lib/images";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const img = await getImageByToken(token);
  if (!img) return new Response("Dieses Bild ist nicht mehr freigegeben.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(Buffer.from(img.data_b64, "base64"), {
    headers: { "Content-Type": img.mime, "Cache-Control": "public, max-age=86400", "X-Robots-Tag": "noindex" },
  });
}
