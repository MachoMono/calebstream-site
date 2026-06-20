import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useState } from "react";
import type { AuthState } from "../lib/auth";
import { createPost } from "../lib/api";

interface Props {
  auth: AuthState;
  onClose: () => void;
  onPublished: () => void;
}

export default function ComposeModal({ auth, onClose, onPublished }: Props) {
  const [title, setTitle] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "ok"; msg: string } | null>(null);
  const [publishing, setPublishing] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: "",
  });

  const parseTags = () =>
    tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 3);

  const handlePublish = async () => {
    if (!editor) return;
    const body_html = editor.getHTML();
    if (!body_html || body_html === "<p></p>") {
      setStatus({ type: "error", msg: "Write something first." });
      return;
    }
    setPublishing(true);
    setStatus(null);
    try {
      await createPost({
        provider: auth.provider,
        token: auth.token,
        title: title.trim() || undefined,
        body_html,
        tags: parseTags(),
      });
      onPublished();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "AUTH_EXPIRED") {
        setStatus({ type: "error", msg: "Session expired — please sign in again." });
      } else if (msg === "RATE_LIMITED") {
        setStatus({ type: "error", msg: "Too many posts — try again in an hour." });
      } else {
        setStatus({ type: "error", msg });
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Make a Post</span>
          <span className="modal-author">as @{auth.handle} · {auth.provider}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <input
            className="field-title"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />

          {preview ? (
            <div
              className="preview-box card-body"
              dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? "" }}
            />
          ) : (
            <>
              <div className="toolbar">
                {[
                  { label: "B",  title: "Bold",          action: () => editor?.chain().focus().toggleBold().run() },
                  { label: "I",  title: "Italic",        action: () => editor?.chain().focus().toggleItalic().run() },
                  { label: "U",  title: "Underline",     action: () => editor?.chain().focus().toggleUnderline().run() },
                  { label: "S",  title: "Strike",        action: () => editor?.chain().focus().toggleStrike().run() },
                  { label: "<>", title: "Code",          action: () => editor?.chain().focus().toggleCode().run() },
                  { label: "H2", title: "Heading",       action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
                  { label: "•",  title: "Bullet list",   action: () => editor?.chain().focus().toggleBulletList().run() },
                  { label: "1.", title: "Ordered list",  action: () => editor?.chain().focus().toggleOrderedList().run() },
                  { label: "❝",  title: "Blockquote",   action: () => editor?.chain().focus().toggleBlockquote().run() },
                ].map(({ label, title: t, action }) => (
                  <button key={label} title={t} className="tb-btn" onMouseDown={(e) => { e.preventDefault(); action(); }}>
                    {label}
                  </button>
                ))}
              </div>
              <EditorContent editor={editor} className="editor-area" />
            </>
          )}

          <input
            className="field-tags"
            placeholder="Topics (comma-separated, up to 3)"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
          />

          {status && (
            <p className={`compose-status ${status.type}`}>{status.msg}</p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={() => setPreview((p) => !p)}>
            {preview ? "Edit" : "Preview"}
          </button>
          <button className="btn-publish" onClick={handlePublish} disabled={publishing}>
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal {
          background: #111;
          border: 1px solid #2a2a2a;
          width: 100%;
          max-width: 640px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #1e1e1e;
          flex-shrink: 0;
        }
        .modal-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.1rem;
          color: #F9C424;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .modal-author {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.7rem;
          color: #555;
        }
        .modal-close {
          margin-left: auto;
          background: none;
          border: none;
          color: #555;
          font-size: 1rem;
          cursor: pointer;
          padding: 0.1rem 0.3rem;
        }
        .modal-close:hover { color: #e8e8e8; }
        .modal-body {
          padding: 0.9rem 1rem;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .field-title, .field-tags {
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          color: #e8e8e8;
          font-family: 'Barlow', sans-serif;
          font-size: 0.88rem;
          padding: 0.45rem 0.65rem;
          outline: none;
          width: 100%;
          transition: border-color 0.15s;
        }
        .field-title:focus, .field-tags:focus { border-color: #F9C424; }
        .field-title::placeholder, .field-tags::placeholder { color: #444; }
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.2rem;
        }
        .tb-btn {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          color: #aaa;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.78rem;
          padding: 0.2rem 0.45rem;
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
        }
        .tb-btn:hover { background: #222; color: #F9C424; }
        .editor-area {
          border: 1px solid #2a2a2a;
          min-height: 180px;
          padding: 0.65rem 0.75rem;
          cursor: text;
          font-size: 0.88rem;
          color: #ccc;
          line-height: 1.6;
          outline: none;
        }
        .editor-area:focus-within { border-color: #333; }
        .editor-area .tiptap { outline: none; min-height: 160px; }
        .editor-area .tiptap p { margin-bottom: 0.5em; }
        .editor-area .tiptap p:last-child { margin-bottom: 0; }
        .editor-area .tiptap h2 { color: #F9C424; margin-bottom: 0.3em; }
        .editor-area .tiptap a { color: #F9C424; }
        .editor-area .tiptap ul, .editor-area .tiptap ol { padding-left: 1.25em; }
        .editor-area .tiptap blockquote {
          border-left: 3px solid #333;
          padding-left: 0.75em;
          color: #888;
        }
        .editor-area .tiptap code {
          background: #1a1a1a;
          padding: 0.1em 0.3em;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.85em;
        }
        .preview-box {
          border: 1px solid #2a2a2a;
          min-height: 180px;
          padding: 0.65rem 0.75rem;
          font-size: 0.88rem;
          color: #ccc;
          line-height: 1.6;
        }
        .preview-box p { margin-bottom: 0.5em; }
        .preview-box a { color: #F9C424; }
        .compose-status {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.75rem;
          padding: 0.3rem 0.5rem;
        }
        .compose-status.error { color: #ff6b6b; background: #1a0505; border: 1px solid #3a1010; }
        .compose-status.ok { color: #a8ffa8; }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1rem;
          border-top: 1px solid #1e1e1e;
          flex-shrink: 0;
        }
        .btn-ghost {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #888;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.3rem 0.75rem;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-ghost:hover { border-color: #888; color: #e8e8e8; }
        .btn-publish {
          background: #F9C424;
          border: none;
          color: #0d0d0d;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.35rem 1.1rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-publish:hover { opacity: 0.9; }
        .btn-publish:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
