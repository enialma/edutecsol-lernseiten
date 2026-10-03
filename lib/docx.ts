// Word-Export: aus der interaktiven Lernseite ein Arbeitsblatt (.docx) in EDUTECSOL-Farben bauen.
// Interaktive Elemente werden in Papierform übersetzt (Eingabefeld → Schreiblinie, Checkbox → Kästchen).
import { parse, HTMLElement, Node, NodeType } from "node-html-parser";
import {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, Packer, PageBreak, PageNumber, Paragraph,
  ShadingType, Table, TableCell, TableRow, TextRun, WidthType, type IParagraphOptions, type ParagraphChild,
} from "docx";

const NAVY = "1E3246", TERRA = "B84816", OCHRE = "F1A51A", CREAM = "F6EFE2", SOFT = "5B6572";
const LINE = "________________";

export type DocxMeta = { title: string; fach?: string | null; stufe?: string | null; created?: string };

// ---------- Vorbereitung des DOM ----------
function unhideAll(root: HTMLElement) {
  for (const el of root.querySelectorAll("[hidden],[aria-hidden],[style]")) {
    el.removeAttribute("hidden");
    el.removeAttribute("aria-hidden");
    const st = el.getAttribute("style") ?? "";
    if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(st)) {
      el.setAttribute("style", st.replace(/display\s*:\s*none;?/gi, "").replace(/visibility\s*:\s*hidden;?/gi, ""));
    }
  }
}

/** Label, das zum Eingabefeld gehört, es aber nicht umschliesst (for=id oder direkt davor). */
function labelFor(root: HTMLElement, el: HTMLElement): HTMLElement | null {
  if (el.closest("label")) return null;
  const id = el.getAttribute("id");
  const byFor = id ? root.querySelectorAll("label").find((l) => l.getAttribute("for") === id) : undefined;
  if (byFor) return byFor;
  const prev = el.previousElementSibling;
  return prev && (prev.tagName ?? "").toLowerCase() === "label" && !prev.getAttribute("for") ? prev : null;
}

function paperize(root: HTMLElement) {
  for (const sel of ["script", "style", "noscript", "head", "title", "meta", "link", "button", "nav", "[role=tablist]", "template", "iframe", "video", "audio", "link", "meta"]) {
    root.querySelectorAll(sel).forEach((e) => e.remove());
  }
  root.querySelectorAll("a").forEach((a) => { const h = a.getAttribute("href") ?? ""; if (/^[←«]/.test(a.text.trim()) || /index\.html$/.test(h) || h === "/" ) a.remove(); });
  root.querySelectorAll("svg, canvas, img").forEach((e) => e.replaceWith(...parse(`<p data-note="1">[Grafik – siehe interaktive Lernseite]</p>`).childNodes));
  for (const el of root.querySelectorAll("input")) {
    const t = (el.getAttribute("type") ?? "text").toLowerCase();
    if (["hidden", "submit", "button", "reset"].includes(t)) { el.remove(); continue; }
    const box = t === "checkbox" ? "☐ " : t === "radio" ? "○ " : null;
    // Getrenntes <label for> + Eingabefeld auf eine Zeile ziehen (Label: ______ bzw. ☐ Label)
    const own = labelFor(root, el);
    if (own) {
      if (box) own.insertAdjacentHTML("afterbegin", `<span>${box}</span>`);
      else own.insertAdjacentHTML("beforeend", `<span>${/[:?]\s*$/.test(own.text) ? " " : ": "}${LINE}</span>`);
      el.remove();
    } else if (box) el.replaceWith(...parse(`<span>${box}</span>`).childNodes);
    else {
      const label = el.closest("label") ? "" : el.getAttribute("placeholder") || el.getAttribute("aria-label") || "";
      el.replaceWith(...parse(`<span>${label ? label + ": " : ""}${LINE}</span>`).childNodes);
    }
  }
  root.querySelectorAll("textarea").forEach((e) => e.replaceWith(...parse(`<p>${LINE}${LINE}${LINE}</p><p>${LINE}${LINE}${LINE}</p><p>${LINE}${LINE}${LINE}</p>`).childNodes));
  root.querySelectorAll("select").forEach((e) => {
    const opts = e.querySelectorAll("option").map((o) => o.text.trim()).filter((t) => t && !/^(bitte|wählen|–|-)/i.test(t));
    e.replaceWith(...parse(`<span>${opts.length ? opts.map((o) => "○ " + o).join("   ") : LINE}</span>`).childNodes);
  });
}

// ---------- Inline-Runs ----------
type Fmt = { bold?: boolean; italics?: boolean; color?: string; underline?: boolean; code?: boolean };

function text(n: string) {
  return n.replace(/\s+/g, " ");
}

function runsOf(node: Node, fmt: Fmt, out: ParagraphChild[]): number {
  if (node.nodeType === NodeType.TEXT_NODE) {
    const t = text(node.rawText.replace(/&nbsp;/g, " "));
    if (t) out.push(new TextRun({ text: decode(t), bold: fmt.bold, italics: fmt.italics, color: fmt.color, underline: fmt.underline ? {} : undefined, font: fmt.code ? "Consolas" : undefined }));
    return t.trim().length;
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) return 0;
  const el = node as HTMLElement;
  const tag = (el.tagName ?? "").toLowerCase();
  if (tag === "br") { out.push(new TextRun({ break: 1 })); return 0; }
  const f: Fmt = { ...fmt };
  if (tag === "strong" || tag === "b") f.bold = true;
  if (tag === "em" || tag === "i") f.italics = true;
  if (tag === "u") f.underline = true;
  if (tag === "code" || tag === "kbd") f.code = true;
  if (tag === "mark") f.color = TERRA;
  if (tag === "a") f.color = TERRA;
  let n = 0;
  for (const c of el.childNodes) n += runsOf(c, f, out);
  return n;
}

function decode(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&auml;/g, "ä").replace(/&ouml;/g, "ö").replace(/&uuml;/g, "ü").replace(/&Auml;/g, "Ä").replace(/&Ouml;/g, "Ö").replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ss").replace(/&middot;/g, "·").replace(/&ndash;/g, "–").replace(/&mdash;/g, "—").replace(/&hellip;/g, "…")
    .replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&times;/g, "×").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

// ---------- Block-Walker ----------
const BLOCK = new Set(["html", "body", "head", "p", "div", "section", "article", "aside", "header", "footer", "main", "ul", "ol", "li", "table", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "hr", "details", "summary", "figure", "figcaption", "form", "fieldset", "legend", "label", "dl", "dt", "dd", "tr", "thead", "tbody", "tfoot"]);

type Ctx = { blocks: (Paragraph | Table)[]; firstPanel: boolean; depth: number; lists: { n: number } };

function pushPara(ctx: Ctx, children: ParagraphChild[], opts: IParagraphOptions = {}, textCount = 1) {
  if (children.length === 0) return;
  if (textCount === 0 && !opts.border) return;
  ctx.blocks.push(new Paragraph({ children, spacing: { after: 120 }, ...opts }));
}

function isTeacher(el: HTMLElement) {
  const s = ((el.getAttribute("class") ?? "") + " " + (el.getAttribute("id") ?? "") + " " + (el.querySelector("summary,h2,h3")?.text ?? "")).toLowerCase();
  return /lehrperson|teacher|lösung|loesung/.test(s);
}

function walk(el: HTMLElement, ctx: Ctx, fmt: Fmt = {}, listKind: "bullet" | "number" | null = null) {
  let inline: ParagraphChild[] = [];
  let inlineCount = 0;
  const flush = () => { pushPara(ctx, inline, {}, inlineCount); inline = []; inlineCount = 0; };

  for (const child of el.childNodes) {
    if (child.nodeType === NodeType.TEXT_NODE) { inlineCount += runsOf(child, fmt, inline); continue; }
    if (child.nodeType !== NodeType.ELEMENT_NODE) continue;
    const c = child as HTMLElement;
    const tag = (c.tagName ?? "").toLowerCase();
    if (!tag) { walk(c, ctx, fmt, listKind); continue; }
    if (!BLOCK.has(tag)) { inlineCount += runsOf(c, fmt, inline); continue; }
    flush();

    switch (tag) {
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": {
        const runs: ParagraphChild[] = [];
        const cnt = runsOf(c, { color: NAVY, bold: true }, runs);
        const lvl = tag === "h1" ? HeadingLevel.HEADING_1 : tag === "h2" ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
        pushPara(ctx, runs, { heading: lvl, spacing: { before: tag === "h1" ? 0 : 240, after: 120 } }, cnt);
        break;
      }
      case "p": case "label": case "legend": case "dt": case "dd": case "figcaption": case "summary": {
        const runs: ParagraphChild[] = [];
        const f = c.getAttribute("data-note") ? { ...fmt, italics: true, color: TERRA } : tag === "summary" || tag === "dt" || tag === "legend" ? { ...fmt, bold: true } : fmt;
        const cnt = runsOf(c, f, runs);
        pushPara(ctx, runs, {}, cnt);
        break;
      }
      case "pre": {
        const runs: ParagraphChild[] = [];
        const cnt = runsOf(c, { ...fmt, code: true }, runs);
        pushPara(ctx, runs, { shading: { type: ShadingType.CLEAR, fill: "F3EEE2" } }, cnt);
        break;
      }
      case "hr":
        ctx.blocks.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: OCHRE } }, spacing: { after: 160 } }));
        break;
      case "blockquote": {
        const inner: Ctx = { blocks: [], firstPanel: ctx.firstPanel, depth: ctx.depth + 1, lists: ctx.lists };
        walk(c, inner, { ...fmt, italics: true });
        for (const b of inner.blocks) ctx.blocks.push(b);
        break;
      }
      case "ul": case "ol": {
        const kind = tag === "ol" ? "number" : "bullet";
        const instance = ++ctx.lists.n;
        for (const li of c.childNodes) {
          if (li.nodeType !== NodeType.ELEMENT_NODE || ((li as HTMLElement).tagName ?? "").toLowerCase() !== "li") continue;
          const liEl = li as HTMLElement;
          const runs: ParagraphChild[] = [];
          const nested: HTMLElement[] = [];
          let cnt = 0;
          for (const n of liEl.childNodes) {
            if (n.nodeType === NodeType.ELEMENT_NODE && ["ul", "ol"].includes(((n as HTMLElement).tagName ?? "").toLowerCase())) nested.push(n as HTMLElement);
            else cnt += runsOf(n, fmt, runs);
          }
          const liText = liEl.text.trim();
          const prefix = kind === "bullet" && !/^[☐○•\-–]/.test(liText) ? "•  " : "";
          if (cnt > 0) pushPara(ctx, [new TextRun({ text: prefix }), ...runs], { indent: { left: 360 + ctx.depth * 360, hanging: 240 }, numbering: kind === "number" ? { reference: "num", level: Math.min(ctx.depth, 2), instance } : undefined, spacing: { after: 60 } });
          for (const n of nested) { const inner: Ctx = { blocks: [], firstPanel: ctx.firstPanel, depth: ctx.depth + 1, lists: ctx.lists }; walk(parse(`<div>${n.outerHTML}</div>`), inner, fmt, kind); ctx.blocks.push(...inner.blocks); }
        }
        break;
      }
      case "table": {
        const rows: TableRow[] = [];
        const trs = c.querySelectorAll("tr");
        for (const tr of trs) {
          const cells = tr.childNodes.filter((n) => n.nodeType === NodeType.ELEMENT_NODE && ["td", "th"].includes(((n as HTMLElement).tagName ?? "").toLowerCase())) as HTMLElement[];
          if (!cells.length) continue;
          rows.push(new TableRow({
            cantSplit: true,
            children: cells.map((cell) => {
              const isTh = (cell.tagName ?? "").toLowerCase() === "th";
              const inner: Ctx = { blocks: [], firstPanel: ctx.firstPanel, depth: ctx.depth + 1, lists: ctx.lists };
              walk(cell, inner, { ...fmt, bold: isTh || undefined, color: isTh ? NAVY : undefined });
              return new TableCell({
                children: inner.blocks.length ? inner.blocks : [new Paragraph("")],
                shading: isTh ? { type: ShadingType.CLEAR, fill: CREAM } : undefined,
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
              });
            }),
          }));
        }
        if (rows.length) {
          const b = { style: BorderStyle.SINGLE, size: 6, color: NAVY };
          ctx.blocks.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b } }));
          ctx.blocks.push(new Paragraph({ spacing: { after: 120 } }));
        }
        break;
      }
      case "details": {
        const teacher = isTeacher(c);
        const summary = c.querySelector("summary");
        const title = summary?.text.trim() || "Weitere Hinweise";
        summary?.remove();
        if (teacher) ctx.blocks.push(new Paragraph({ children: [new PageBreak()] }));
        pushPara(ctx, [new TextRun({ text: decode(title), bold: true, color: teacher ? TERRA : NAVY, size: 26 })], { heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, border: teacher ? { bottom: { style: BorderStyle.SINGLE, size: 8, color: TERRA } } : undefined });
        walk(c, ctx, fmt);
        break;
      }
      default: {
        // section/div/article … – Zugänge (tabpanel) je auf neue Seite
        const role = c.getAttribute("role");
        const teacher = tag !== "div" && isTeacher(c);
        if (role === "tabpanel") {
          if (!ctx.firstPanel) ctx.blocks.push(new Paragraph({ children: [new PageBreak()] }));
          ctx.firstPanel = false;
        } else if (teacher) {
          ctx.blocks.push(new Paragraph({ children: [new PageBreak()] }));
        }
        walk(c, ctx, fmt, listKind);
      }
    }
  }
  flush();
}

// ---------- Dokument ----------
export async function lernseiteToDocx(html: string, meta: DocxMeta): Promise<Buffer> {
  // Vorab bereinigen: Doctype weg, Script/Style per Regex entfernen (der Parser stolpert sonst über deren Inhalt)
  const cleaned = html
    .replace(/^[\s\S]*?<html/i, "<html")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/i, "");
  const doc = parse(cleaned, { blockTextElements: { pre: true } });
  const body = doc.querySelector("body") ?? doc.querySelector("html") ?? doc;
  unhideAll(body);
  paperize(body);
  // Erste h1 entfernen – der Titel kommt aus dem Kopf
  body.querySelector("h1")?.remove();

  const ctx: Ctx = { blocks: [], firstPanel: true, depth: 0, lists: { n: 0 } };
  walk(body, ctx);

  const head: (Paragraph | Table)[] = [
    new Paragraph({ children: [new TextRun({ text: "EDUTECSOL · DIFFERENZIERTE LERNSEITE", color: TERRA, size: 16, bold: true, characterSpacing: 40 })], spacing: { after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: meta.title, color: NAVY, bold: true, size: 40 })], border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TERRA } }, spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: [meta.fach, meta.stufe].filter(Boolean).join(" · "), color: SOFT, size: 20 })], spacing: { after: 160 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.SINGLE, size: 6, color: NAVY }, bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY }, left: { style: BorderStyle.SINGLE, size: 6, color: NAVY }, right: { style: BorderStyle.SINGLE, size: 6, color: NAVY }, insideVertical: { style: BorderStyle.SINGLE, size: 6, color: NAVY }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
      rows: [new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name: " + LINE })] })], shading: { type: ShadingType.CLEAR, fill: CREAM }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 50, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Datum: ________   Zugang: ☐ A  ☐ B  ☐ C" })] })], shading: { type: ShadingType.CLEAR, fill: CREAM }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 50, type: WidthType.PERCENTAGE } }),
      ] })],
    }),
    new Paragraph({ spacing: { after: 200 } }),
  ];

  const document = new Document({
    creator: "lernwege.edutecsol.ch",
    title: meta.title,
    styles: {
      default: { document: { run: { font: "Arial", size: 22, color: "111111" } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, color: NAVY, font: "Arial" }, paragraph: { spacing: { before: 240, after: 120 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, color: NAVY, font: "Arial" }, paragraph: { spacing: { before: 240, after: 100 } } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: NAVY, font: "Arial" }, paragraph: { spacing: { before: 180, after: 80 } } },
      ],
    },
    numbering: { config: [{ reference: "num", levels: [0, 1, 2].map((l) => ({ level: l, format: "decimal" as const, text: "%" + (l + 1) + ".", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360 + l * 360, hanging: 260 } } } })) }] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: `${meta.title} · lernwege.edutecsol.ch${meta.created ? " · " + meta.created : ""} · Seite `, color: SOFT, size: 16 }),
          new TextRun({ children: [PageNumber.CURRENT], color: SOFT, size: 16 }),
        ] })] }),
      },
      children: [...head, ...ctx.blocks],
    }],
  });
  return Packer.toBuffer(document);
}
