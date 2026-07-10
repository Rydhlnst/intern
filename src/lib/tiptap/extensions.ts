import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import CharacterCount from "@tiptap/extension-character-count";

/**
 * Shared extension list used by both the client-side editor and the
 * server-side generateHTML() call. Keeping this identical is what makes
 * stored JSON safe to render without an HTML sanitizer.
 */
export function buildExtensions(options?: {
  placeholder?: string;
  maxChars?: number;
}) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
    }),
    Placeholder.configure({
      placeholder: options?.placeholder ?? "Tulis di sini...",
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      },
    }),
    CharacterCount.configure({ limit: options?.maxChars }),
  ];
}
