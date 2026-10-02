// Text aus hochgeladenen Dateien ziehen (PDF, DOCX, PPTX, TXT/MD).
import JSZip from "jszip";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel-Limit für Request-Bodies liegt bei 4,5 MB
export const MAX_MATERIAL_CHARS = 60_000; // ~15k Tokens – reicht für einen Foliensatz oder ein Kapitel

export type Extracted = { name: string; text: string; truncated: boolean; kind: string };

function clip(text: string): { text: string; truncated: boolean } {
  const t = text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (t.length <= MAX_MATERIAL_CHARS) return { text: t, truncated: false };
  return { text: t.slice(0, MAX_MATERIAL_CHARS) + "\n\n[… Material gekürzt …]", truncated: true };
}

async function fromPdf(buf: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return typeof text === "string" ? text : (text as string[]).join("\n\n");
}

async function fromDocx(buf: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const r = await mammoth.extractRawText({ buffer: buf });
  return r.value;
}

async function fromPptx(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  const slides = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
  const notes = (n: string) => n.replace(/^ppt\/slides\/slide(\d+)\.xml$/, "ppt/notesSlides/notesSlide$1.xml");
  const out: string[] = [];
  for (const [i, name] of slides.entries()) {
    const xml = await zip.file(name)!.async("string");
    const paras = xml.split(/<\/a:p>/).map((p) =>
      (p.match(/<a:t>([^<]*)<\/a:t>/g) ?? []).map((t) => t.replace(/<\/?a:t>/g, "")).join("")
    ).filter((s) => s.trim());
    let block = `--- Folie ${i + 1} ---\n${paras.join("\n")}`;
    const nf = zip.file(notes(name));
    if (nf) {
      const nx = await nf.async("string");
      const nt = (nx.match(/<a:t>([^<]*)<\/a:t>/g) ?? []).map((t) => t.replace(/<\/?a:t>/g, "")).join(" ").trim();
      if (nt) block += `\n[Notizen: ${nt}]`;
    }
    out.push(block);
  }
  return out.join("\n\n");
}

function decodeXml(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

export async function extractFromFile(file: File): Promise<Extracted> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`Datei zu gross (max. ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB).`);
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name;
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  let text = "";
  let kind = ext;
  if (ext === "pdf") text = await fromPdf(buf);
  else if (ext === "docx") text = await fromDocx(buf);
  else if (ext === "pptx") text = decodeXml(await fromPptx(buf));
  else if (["txt", "md", "csv"].includes(ext)) text = buf.toString("utf8");
  else throw new Error("Dateityp nicht unterstützt. Erlaubt: PDF, Word (.docx), PowerPoint (.pptx), Text.");
  if (!text.trim()) throw new Error("Aus der Datei liess sich kein Text auslesen (nur Bilder?). Bitte Thema als Text beschreiben.");
  const c = clip(text);
  return { name, text: c.text, truncated: c.truncated, kind };
}
