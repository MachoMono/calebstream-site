import type { Post } from "../lib/api";

const AVATARS = [
  "av00.webp","av01.webp","av02.webp","av03.webp","av04.webp",
  "av05.webp","av06.webp","av07.webp","av08.webp","av09.webp",
  "av10.webp","av11.webp","av12.webp","av13.webp","av14.webp",
  "av16.webp","av17.webp","av18.webp","av22.webp","av23.webp",
  "av25.webp","av26.webp","av27.webp",
];

function avatarFor(handle: string): string {
  let h = 0;
  for (let i = 0; i < handle.length; i++) {
    h = (Math.imul(31, h) + handle.charCodeAt(i)) | 0;
  }
  return `/avatars/${AVATARS[Math.abs(h) % AVATARS.length]}`;
}

function relTime(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const PLATFORM_LABEL: Record<string, string> = {
  twitch:    "twitch",
  youtube:   "youtube",
  twitter:   "twitter",
  bluesky:   "bluesky",
  instagram: "instagram",
  other:     "other",
};

export default function PostCard({ post, selected, onSelect }: { post: Post; selected: boolean; onSelect: () => void }) {
  const avatar = post.avatar_url || avatarFor(post.handle);
  const platform = PLATFORM_LABEL[post.platform] ?? "other";

  const body = post.body_html
    ? <div className="card-body" dangerouslySetInnerHTML={{ __html: post.body_html }} />
    : <p className="card-body card-body--plain">{post.message}</p>;

  return (
    <article
      className={`post-card${selected ? " post-card--selected" : ""}`}
      onClick={onSelect}
    >
      <img className="post-avatar" src={avatar} alt="" loading="lazy" />
      <div className="post-main">
        <div className="post-head">
          <span className="post-handle">@{post.handle}</span>
          <span className="post-platform">{platform}</span>
          {post.word_count != null && (
            <span className="post-meta">{post.word_count} words</span>
          )}
          <span className="post-ts">{relTime(post.ts)}</span>
        </div>
        {post.title && <h2 className="post-title">{post.title}</h2>}
        {body}
        {post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((t) => (
              <span key={t} className="post-tag">{t}</span>
            ))}
          </div>
        )}
        <div className="post-footer">
          <button className="post-action">[Open]</button>
          <button className="post-action">[Save]</button>
        </div>
      </div>

      <style>{`
        .post-card {
          display: grid;
          grid-template-columns: 64px 1fr;
          gap: 1.1rem;
          padding: 1.4rem 1.75rem;
          background: var(--bg);
          border: 2px solid var(--border);
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.1s, border-color 0.1s, box-shadow 0.1s;
        }
        .post-card:hover { background: var(--bg-hover); }
        .post-card--selected {
          border-color: var(--fg);
          border-width: 3px;
          box-shadow: 4px 4px 0 var(--fg);
        }
        .post-avatar {
          width: 64px;
          height: 64px;
          border-radius: 4px;
          object-fit: cover;
          border: 2px solid var(--border);
          flex-shrink: 0;
        }
        .post-main { min-width: 0; }
        .post-head {
          display: flex;
          align-items: baseline;
          gap: 0.7rem;
          flex-wrap: wrap;
          margin-bottom: 0.6rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.6rem;
        }
        .post-handle {
          font-family: var(--font-mono);
          font-size: 1.2rem;
          font-weight: bold;
          color: var(--fg);
        }
        .post-platform {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--fg-dim);
          border: 1px solid var(--border);
          padding: 0.05em 0.4em;
        }
        .post-meta {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--fg-dim);
        }
        .post-ts {
          margin-left: auto;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--fg-dim);
          white-space: nowrap;
        }
        .post-title {
          font-family: var(--font-mono);
          font-size: 1.55rem;
          font-weight: bold;
          color: var(--fg);
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        .card-body {
          font-family: var(--font-mono);
          font-size: 1.1rem;
          color: var(--fg);
          line-height: 1.75;
          word-break: break-word;
        }
        .card-body--plain { margin: 0; }
        .card-body p { margin-bottom: 0.6em; }
        .card-body p:last-child { margin-bottom: 0; }
        .card-body a { color: var(--fg); text-decoration: underline; }
        .card-body ul, .card-body ol { padding-left: 1.5em; }
        .card-body blockquote {
          border-left: 3px solid var(--border);
          padding-left: 0.75em;
          color: var(--fg-dim);
          margin: 0.5em 0;
        }
        .card-body code {
          background: var(--bg-dim);
          padding: 0.05em 0.35em;
          font-family: var(--font-mono);
          border: 1px solid var(--border);
        }
        .card-body pre {
          background: var(--bg-dim);
          border: 1px solid var(--border);
          padding: 0.6em 0.8em;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        .post-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0;
          margin-top: 0.75rem;
        }
        .post-tag {
          font-family: var(--font-mono);
          font-size: 0.88rem;
          color: var(--fg-dim);
          border: 1px solid var(--border);
          padding: 0.15em 0.6em;
          margin-left: -1px;
          transition: color 0.1s, background 0.1s;
          cursor: default;
        }
        .post-tag:hover { background: var(--bg-hover); color: var(--fg); }
        .post-footer {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
          padding-top: 0.6rem;
          border-top: 1px solid var(--border);
        }
        .post-action {
          background: transparent;
          border: none;
          color: var(--fg-dim);
          font-family: var(--font-mono);
          font-size: 0.88rem;
          cursor: pointer;
          padding: 0;
          transition: color 0.1s;
        }
        .post-action:hover { color: var(--fg); }
        @media (max-width: 600px) {
          .post-card {
            grid-template-columns: 48px 1fr;
            gap: 0.75rem;
            padding: 1rem 1.1rem;
          }
          .post-avatar { width: 48px; height: 48px; }
          .post-handle { font-size: 1rem; }
          .card-body { font-size: 1rem; }
          .post-title { font-size: 1.25rem; }
        }
      `}</style>
    </article>
  );
}
