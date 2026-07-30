"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

export default function RichEditor({
  content,
  onChange,
  placeholder = "Dearest...",
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep the editor in sync if the letter is loaded asynchronously (edit page).
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content && editor.isEmpty) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  if (!editor) return <div className="editor-shell" style={{ minHeight: 260 }} />;

  return (
    <div className="editor-shell">
      <div className="rt-toolbar">
        <button type="button" className={editor.isActive("bold") ? "on" : ""} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <b>B</b>
        </button>
        <button type="button" className={editor.isActive("italic") ? "on" : ""} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <i>I</i>
        </button>
        <button type="button" className={editor.isActive("underline") ? "on" : ""} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <u>U</u>
        </button>
        <button type="button" className={editor.isActive("bulletList") ? "on" : ""} onClick={() => editor.chain().focus().toggleBulletList().run()} title="List">
          &#8226;
        </button>
        <button type="button" className={editor.isActive("blockquote") ? "on" : ""} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
          &#8221;
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
