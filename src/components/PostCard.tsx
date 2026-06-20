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
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const PLATFORM_BADGE: Record<string, { label: string; color: string }> = {
  twitch:    { label: "Twitch",    color: "#9147ff" },
  youtube:   { label: "YouTube",   color: "#ff0000" },
  twitter:   { label: "Twitter",   color: "#1da1f2" },
  bluesky:   { label: "Bluesky",   color: "#0085ff" },
  instagram: { label: "Instagram", color: "#e1306c" },
  other:     { label: "other",     color: "#888" },
};

export default function PostCard({ post }: { post: Post }) {
  const avatar = post.avatar_url || avatarFor(post.handle);
  const badge = PLATFORM_BADGE[post.platform] ?? PLATFORM_BADGE.other;

  // Legacy entries have plain message; new entries have body_html
  const body = post.body_html
    ? <div className="card-body" dangerouslySetInnerHTML={{ __html: post.body_html }} />
    : <p className="card-body card-body--plain">{post.message}</p>;

  return (
    <article className="post-card">
      <img className="post-avatar" src={avatar} alt="" loading="lazy" />
      <div className="post-main">
        <div className="post-head">
          <span className="post-handle">@{post.handle}</span>
          <span className="post-badge" style={{ background: badge.color }}>{badge.label}</span>
          {post.word_count != null && (
            <span className="post-meta">{post.word_count}w</span>
          )}
          <span className="post-ts">{relTime(post.ts)}</span>
        </div>
        {post.title && <h2 className="post-title">{post.title}</h2>}
        {body}
        {post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((t) => (
              <span key={t} className="post-tag">#{t}</span>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .post-card {
          display: grid;
          grid-template-columns: 44px 1fr;
          gap: 0.75rem;
          padding: 1rem 1.1rem;
          background: #111;
          border: 1px solid #1e1e1e;
          transition: border-color 0.15s;
        }
        .post-card:hover { border-color: #333; }
        .post-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #222;
          flex-shrink: 0;
        }
        .post-main { min-width: 0; }
        .post-head {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 0.3rem;
        }
        .post-handle {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: #e8e8e8;
        }
        .post-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.05em;
          color: #fff;
          padding: 0.1em 0.45em;
          border-radius: 2px;
          text-transform: uppercase;
        }
        .post-meta {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.65rem;
          color: #555;
        }
        .post-ts {
          margin-left: auto;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.65rem;
          color: #555;
          white-space: nowrap;
        }
        .post-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          color: #F9C424;
          margin-bottom: 0.3rem;
          line-height: 1.2;
        }
        .card-body {
          font-size: 0.88rem;
          color: #ccc;
          line-height: 1.6;
          word-break: break-word;
        }
        .card-body--plain { margin: 0; }
        .card-body p { margin-bottom: 0.5em; }
        .card-body p:last-child { margin-bottom: 0; }
        .card-body a { color: #F9C424; }
        .card-body ul, .card-body ol { padding-left: 1.25em; }
        .card-body blockquote {
          border-left: 3px solid #333;
          padding-left: 0.75em;
          color: #888;
          margin: 0.5em 0;
        }
        .card-body code {
          background: #1a1a1a;
          padding: 0.1em 0.3em;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.85em;
        }
        .card-body pre {
          background: #1a1a1a;
          padding: 0.6em 0.8em;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        .post-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin-top: 0.5rem;
        }
        .post-tag {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.65rem;
          color: #888;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          padding: 0.1em 0.45em;
        }
      `}</style>
    </article>
  );
}
