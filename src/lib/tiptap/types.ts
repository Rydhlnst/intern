export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
};

export type TiptapDoc = {
  type: "doc";
  content?: TiptapNode[];
};

export const emptyTiptapDoc: TiptapDoc = { type: "doc", content: [] };

export function isTiptapDoc(value: unknown): value is TiptapDoc {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "doc"
  );
}
