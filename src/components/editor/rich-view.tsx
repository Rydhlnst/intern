import "server-only";

import { generateHTML } from "@tiptap/html";

import { cn } from "@/lib/utils";
import { buildExtensions } from "@/lib/tiptap/extensions";
import { isTiptapDoc, type TiptapDoc } from "@/lib/tiptap/types";

type RichViewProps = {
  doc: TiptapDoc | null | undefined;
  className?: string;
  emptyFallback?: React.ReactNode;
};

// Server component. Safe by construction: we only feed generateHTML with
// nodes/marks defined by our fixed extension list, so no sanitizer is needed.
export function RichView({ doc, className, emptyFallback }: RichViewProps) {
  if (!doc || !isTiptapDoc(doc) || !doc.content?.length) {
    return emptyFallback ? <>{emptyFallback}</> : null;
  }
  const html = generateHTML(doc, buildExtensions());
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        className
      )}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
