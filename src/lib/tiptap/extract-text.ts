import type { TiptapDoc, TiptapNode } from "./types";

function walk(node: TiptapNode, chunks: string[]): void {
  if (node.text) chunks.push(node.text);
  if (node.content) {
    for (const child of node.content) walk(child, chunks);
    if (node.type === "paragraph" || node.type === "heading") chunks.push(" ");
  }
}

/**
 * Plain-text preview from a Tiptap doc — used for card summaries and
 * server-side length checks. Not an HTML sanitizer; do not use for rendering.
 */
export function extractText(doc: TiptapDoc | null | undefined, maxLen = 400): string {
  if (!doc) return "";
  const chunks: string[] = [];
  for (const child of doc.content ?? []) walk(child, chunks);
  const text = chunks.join("").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + "…" : text;
}
