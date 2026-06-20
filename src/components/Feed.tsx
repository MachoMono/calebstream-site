import { useEffect, useState, useCallback } from "react";
import PostCard from "./PostCard";
import ComposeModal from "./ComposeModal";
import type { Post } from "../lib/api";
import { getPosts } from "../lib/api";
import {
  getAuth,
  setAuth,
  clearAuth,
  loginWithTwitch,
  loginWithGoogle,
  parseTwitchCallback,
  type AuthState,
} from "../lib/auth";

type SignInChoice = "twitch" | "youtube" | null;

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auth, setAuthState] = useState<AuthState | null>(null);
  const [compose, setCompose] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signInChoice, setSignInChoice] = useState<SignInChoice>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const data = await getPosts();
      setPosts(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveTwitchIdentity = useCallback(async (token: string): Promise<AuthState | null> => {
    try {
      const res = await fetch("https://api.twitch.tv/helix/users", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Client-Id": "usmetfnk74m2ciy5a74dzowuxe6m34",
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const user = data.data?.[0];
      if (!user) return null;
      return {
        provider: "twitch",
        token,
        handle: user.display_name,
        avatarUrl: user.profile_image_url ?? null,
      };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const saved = getAuth();
    if (saved) setAuthState(saved);

    const twitchToken = parseTwitchCallback();
    if (twitchToken) {
      setAuthLoading(true);
      resolveTwitchIdentity(twitchToken).then((state) => {
        if (state) {
          setAuth(state);
          setAuthState(state);
        }
        setAuthLoading(false);
      });
    }

    loadPosts();
  }, [loadPosts, resolveTwitchIdentity]);

  const handleSignIn = (provider: "twitch" | "youtube") => {
    if (provider === "twitch") {
      loginWithTwitch();
    } else {
      setAuthLoading(true);
      loginWithGoogle((credential) => {
        try {
          const payload = JSON.parse(atob(credential.split(".")[1]));
          const state: AuthState = {
            provider: "youtube",
            token: credential,
            handle: payload.name || payload.email || "unknown",
            avatarUrl: payload.picture ?? null,
          };
          setAuth(state);
          setAuthState(state);
        } catch {
          // ignore
        } finally {
          setAuthLoading(false);
        }
      });
    }
    setSignInChoice(null);
  };

  const handleSignOut = () => {
    clearAuth();
    setAuthState(null);
  };

  const handleMakePost = () => {
    if (auth) {
      setCompose(true);
    } else {
      setSignInChoice("twitch");
    }
  };

  return (
    <main className="feed-root">
      <div className="feed-toolbar">
        <span className="feed-heading">// feed</span>
        <div className="feed-toolbar-right">
          {authLoading ? (
            <span className="auth-status">authenticating...</span>
          ) : auth ? (
            <span className="auth-status">
              {auth.avatarUrl && <img className="auth-avatar" src={auth.avatarUrl} alt="" />}
              @{auth.handle}
              <button className="lc-btn" onClick={handleSignOut}>[sign out]</button>
            </span>
          ) : null}
          <button className="lc-btn lc-btn--primary" onClick={handleMakePost}>
            [+ make a post]
          </button>
        </div>
      </div>

      {loading && <p className="feed-state">loading...</p>}
      {error && <p className="feed-state feed-error">error: {error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="feed-state">no posts yet — be the first.</p>
      )}

      <div className="feed-list">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            selected={selectedId === p.id}
            onSelect={() => setSelectedId((cur) => cur === p.id ? null : p.id)}
          />
        ))}
      </div>

      {signInChoice !== null && (
        <div className="overlay" onClick={() => setSignInChoice(null)}>
          <div className="signin-box" onClick={(e) => e.stopPropagation()}>
            <p className="signin-title">// sign in to post</p>
            <button className="signin-btn" onClick={() => handleSignIn("twitch")}>[sign in with Twitch]</button>
            <button className="signin-btn" onClick={() => handleSignIn("youtube")}>[sign in with YouTube]</button>
            <button className="signin-cancel" onClick={() => setSignInChoice(null)}>[cancel]</button>
          </div>
        </div>
      )}

      {compose && auth && (
        <ComposeModal
          auth={auth}
          onClose={() => setCompose(false)}
          onPublished={loadPosts}
        />
      )}

      <style>{`
        .feed-root {
          max-width: 680px;
          margin: 0 auto;
          padding: 1.5rem 1.5rem 4rem;
        }
        .feed-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid var(--border);
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .feed-heading {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--fg-dim);
          letter-spacing: 0.05em;
        }
        .feed-toolbar-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .auth-status {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--fg-dim);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .auth-avatar {
          width: 18px;
          height: 18px;
          border-radius: 1px;
          object-fit: cover;
          border: 1px solid var(--border);
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
        .lc-btn--primary { color: var(--fg); font-weight: bold; }
        .feed-state {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: var(--fg-dim);
          padding: 2rem 0;
          text-align: center;
        }
        .feed-error { color: #880000; }
        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        /* sign-in overlay */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(234,234,228,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .signin-box {
          background: var(--bg);
          border: 1px solid var(--fg);
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          min-width: 240px;
          box-shadow: 4px 4px 0 var(--fg);
        }
        .signin-title {
          font-family: var(--font-mono);
          font-size: 0.82rem;
          color: var(--fg-dim);
          margin-bottom: 0.25rem;
        }
        .signin-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--fg);
          font-family: var(--font-mono);
          font-size: 0.82rem;
          padding: 0.4rem 0.75rem;
          cursor: pointer;
          text-align: left;
          transition: background 0.1s;
        }
        .signin-btn:hover { background: var(--bg-hover); }
        .signin-cancel {
          background: transparent;
          border: none;
          color: var(--fg-dim);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          cursor: pointer;
          padding: 0;
          margin-top: 0.15rem;
          text-align: left;
          transition: color 0.1s;
        }
        .signin-cancel:hover { color: var(--fg); }
      `}</style>
    </main>
  );
}
