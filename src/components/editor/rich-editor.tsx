"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { buildExtensions } from "@/lib/tiptap/extensions";
import { emptyTiptapDoc, isTiptapDoc, type TiptapDoc } from "@/lib/tiptap/types";

type RichEditorProps = {
  value: TiptapDoc | null | undefined;
  onChange: (doc: TiptapDoc) => void;
  placeholder?: string;
  maxChars?: number;
  className?: string;
  editable?: boolean;
};

export function RichEditor({
  value,
  onChange,
  placeholder,
  maxChars,
  className,
  editable = true,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: buildExtensions({ placeholder, maxChars }),
    content: value && isTiptapDoc(value) ? value : emptyTiptapDoc,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
          "min-h-32 px-3 py-2"
        ),
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON() as TiptapDoc);
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    if (editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-md border border-input bg-background",
          className
        )}
      >
        <div className="h-32" />
      </div>
    );
  }

  const chars = editor.storage.characterCount?.characters?.() as
    | number
    | undefined;

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring/30",
        className
      )}
    >
      {editable ? (
        <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="Bold"
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="Italic"
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            label="Heading 2"
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("heading", { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            label="Heading 3"
          >
            <Heading3 className="size-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            label="Bullet list"
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            label="Ordered list"
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            label="Quote"
          >
            <Quote className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("link")}
            onClick={() => promptForLink(editor)}
            label="Link"
          >
            <LinkIcon className="size-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            active={false}
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            label="Undo"
          >
            <Undo2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            active={false}
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            label="Redo"
          >
            <Redo2 className="size-4" />
          </ToolbarButton>
        </div>
      ) : null}
      <EditorContent editor={editor} />
      {editable && typeof maxChars === "number" ? (
        <div className="flex justify-end px-3 py-1 text-xs text-muted-foreground">
          {chars ?? 0} / {maxChars}
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  disabled,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="size-8"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      {children}
    </Button>
  );
}

function promptForLink(editor: ReturnType<typeof useEditor> & object) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("URL", previous ?? "");
  if (url === null) return;
  if (url === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}
