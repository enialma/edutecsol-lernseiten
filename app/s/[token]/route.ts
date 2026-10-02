// Öffentlicher Freigabelink: Lernende öffnen die Seite ohne Login.
import { getPageByToken } from "@/lib/pages";
import { withPrintCss } from "@/lib/print";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const page = await getPageByToken(token);
  if (!page) {
    return new Response(
      `<!DOCTYPE html><html lang="de-CH"><head><meta charset="utf-8"><title>Nicht gefunden</title></head>
<body style="font-family:Arial,sans-serif;background:#F6EFE2;color:#1E3246;display:grid;place-items:center;min-height:100vh;margin:0">
<div style="text-align:center"><h1 style="margin:0 0 .4rem">Diese Lernseite ist nicht mehr freigegeben.</h1><p>Bitte bei der Lehrperson nachfragen.</p></div></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
  return new Response(withPrintCss(page.html), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, max-age=0, must-revalidate", "X-Robots-Tag": "noindex" },
  });
}
