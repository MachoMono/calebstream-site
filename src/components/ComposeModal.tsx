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
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false })],
    content: "",
  });

  const parseTags = () =>
    tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 3);

  const handlePublish = async () => {
    if (!editor) return;
    const body_html = editor.getHTML();
    if (!body_html || body_html === "<p></p>") {
      setStatus({ type: "error", msg: "write something first." });
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
      if (msg === "AUTH_EXPIRED") setStatus({ type: "error", msg: "session expired — sign in again." });
      else if (msg === "RATE_LIMITED") setStatus({ type: "error", msg: "too many posts — wait an hour." });
      else setStatus({ type: "error", msg });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">// make a post</span>
          <span className="modal-author">as @{auth.handle} · {auth.provider}</span>
          <button className="modal-close" onClick={onClose}>[x]</button>
        </div>

        <div className="modal-body">
          <input
            className="field"
            placeholder="title (optional)"
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
                  { label: "B",  title: "Bold",         fn: () => editor?.chain().focus().toggleBold().run() },
                  { label: "I",  title: "Italic",       fn: () => editor?.chain().focus().toggleItalic().run() },
                  { label: "U",  title: "Underline",    fn: () => editor?.chain().focus().toggleUnderline().run() },
                  { label: "S",  title: "Strike",       fn: () => editor?.chain().focus().toggleStrike().run() },
                  { label: "<>", title: "Code",         fn: () => editor?.chain().focus().toggleCode().run() },
                  { label: "H2", title: "Heading",      fn: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
                  { label: "• ", title: "Bullet list",  fn: () => editor?.chain().focus().toggleBulletList().run() },
                  { label: "1.", title: "Ordered list", fn: () => editor?.chain().focus().toggleOrderedList().run() },
                  { label: "❝",  title: "Blockquote",  fn: () => editor?.chain().focus().toggleBlockquote().run() },
                ].map(({ label, title: t, fn }) => (
                  <button key={label} title={t} className="tb-btn" onMouseDown={(e) => { e.preventDefault(); fn(); }}>
                    {label}
                  </button>
                ))}
              </div>
              <EditorContent editor={editor} className="editor-area" />
            </>
          )}

          <input
            className="field"
            placeholder="topics (comma-separated, up to 3)"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
          />

          {status && <p className={`compose-status ${status.type}`}>{status.msg}</p>}
        </div>

        <div className="modal-footer">
          <button className="lc-btn" onClick={() => setPreview((p) => !p)}>
            {preview ? "[edit]" : "[preview]"}
          </button>
          <button className="lc-btn lc-btn--publish" onClick={handlePublish} disabled={publishing}>
            {publishing ? "[publishing...]" : "[publish]"}
          </button>
        </div>
      </div>

      <style>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(234,234,228,0.88);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal {
          background: var(--bg);
          border: 1px solid var(--fg);
          width: 100%;
          max-width: 620px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 5px 5px 0 var(--fg);
        }
        .modal-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 0.9rem;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .modal-title {
          font-family: var(--font-mono);
          font-size: 0.82rem;
          color: var(--fg);
        }
        .modal-author {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--fg-dim);
        }
        .modal-close {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--fg-dim);
          font-family: var(--font-mono);
          font-size: 0.78rem;
          cursor: pointer;
          padding: 0;
          transition: color 0.1s;
        }
        .modal-close:hover { color: var(--fg); }
        .modal-body {
          padding: 0.8rem 0.9rem;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .field {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--fg);
          font-family: var(--font-mono);
          font-size: 0.82rem;
          padding: 0.35rem 0.55rem;
          outline: none;
          width: 100%;
          transition: border-color 0.1s;
        }
        .field:focus { border-color: var(--fg); }
        .field::placeholder { color: var(--fg-dim); }
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0;
        }
        .tb-btn {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--fg-dim);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          padding: 0.2rem 0.45rem;
          cursor: pointer;
          margin-left: -1px;
          transition: background 0.1s, color 0.1s;
        }
        .tb-btn:hover { background: var(--bg-hover); color: var(--fg); }
        .editor-area {
          border: 1px solid var(--border);
          min-height: 160px;
          padding: 0.5rem 0.65rem;
          cursor: text;
          font-size: 0.82rem;
          font-family: var(--font-mono);
          color: var(--fg);
          line-height: 1.65;
          background: var(--bg);
        }
        .editor-area:focus-within { border-color: var(--fg); }
        .editor-area .tiptap { outline: none; min-height: 140px; }
        .editor-area .tiptap p { margin-bottom: 0.45em; }
        .editor-area .tiptap p:last-child { margin-bottom: 0; }
        .editor-area .tiptap a { color: var(--fg); text-decoration: underline; }
        .editor-area .tiptap ul, .editor-area .tiptap ol { padding-left: 1.4em; }
        .editor-area .tiptap blockquote {
          border-left: 2px solid var(--border);
          padding-left: 0.6em;
          color: var(--fg-dim);
        }
        .editor-area .tiptap code {
          background: var(--bg-dim);
          border: 1px solid var(--border);
          padding: 0.05em 0.3em;
          font-family: var(--font-mono);
          font-size: 0.9em;
        }
        .preview-box {
          border: 1px solid var(--border);
          min-height: 160px;
          padding: 0.5rem 0.65rem;
          font-size: 0.82rem;
          font-family: var(--font-mono);
          color: var(--fg);
          line-height: 1.65;
          background: var(--bg-dim);
        }
        .preview-box p { margin-bottom: 0.45em; }
        .compose-status {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          padding: 0.25rem 0.4rem;
          border: 1px solid;
        }
        .compose-status.error { color: #880000; border-color: #cc8888; background: #fff0f0; }
        .compose-status.ok { color: #006600; border-color: #88cc88; }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0.75rem;
          padding: 0.55rem 0.9rem;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        .lc-btn {
          background: transparent;
          border: none;
          color: var(--fg-dim);
          font-family: var(--font-mono);
          font-size: 0.78rem;
          cursor: pointer;
          padding: 0;
          transition: color 0.1s;
        }
        .lc-btn:hover { color: var(--fg); }
        .lc-btn--publish {
          color: var(--fg);
          font-weight: bold;
        }
        .lc-btn--publish:disabled { opacity: 0.4; cursor: not-allowed; }
        .card-body { font-family: var(--font-mono); font-size: 0.82rem; color: var(--fg); line-height: 1.65; }
        .card-body p { margin-bottom: 0.45em; }
        .card-body a { color: var(--fg); text-decoration: underline; }
      `}</style>
    </div>
  );
}
