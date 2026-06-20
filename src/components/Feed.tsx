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

  // Resolve Twitch token → fetch identity via backend by trying to post
  // We do a lightweight identity fetch instead: use the Helix /users endpoint
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
    // Restore auth from session
    const saved = getAuth();
    if (saved) setAuthState(saved);

    // Handle Twitch redirect callback
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
        // Decode JWT payload for display name + avatar (client-side only for UI; backend re-verifies)
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
      setSignInChoice("twitch"); // triggers the sign-in picker
    }
  };

  const handlePublished = () => {
    // Optimistically reload
    loadPosts();
  };

  return (
    <main className="feed-root">
      <div className="feed-toolbar">
        <h1 className="feed-heading">Feed</h1>
        <div className="feed-toolbar-right">
          {authLoading ? (
            <span className="auth-loading">signing in…</span>
          ) : auth ? (
            <div className="auth-control">
              {auth.avatarUrl && <img className="auth-avatar" src={auth.avatarUrl} alt="" />}
              <span className="auth-handle">@{auth.handle}</span>
              <button className="btn-nav" onClick={handleSignOut}>sign out</button>
            </div>
          ) : null}
          <button className="btn-make-post" onClick={handleMakePost}>
            + Make a Post
          </button>
        </div>
      </div>

      {loading && <p className="feed-state">Loading…</p>}
      {error && <p className="feed-state feed-error">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="feed-state feed-empty">No posts yet — be the first!</p>
      )}

      <div className="feed-list">
        {posts.map((p) => <PostCard key={p.id} post={p} />)}
      </div>

      {/* Sign-in picker */}
      {signInChoice !== null && (
        <div className="modal-backdrop" onClick={() => setSignInChoice(null)}>
          <div className="signin-picker" onClick={(e) => e.stopPropagation()}>
            <p className="signin-label">Sign in to post</p>
            <button className="btn-signin btn-signin--twitch" onClick={() => handleSignIn("twitch")}>
              Sign in with Twitch
            </button>
            <button className="btn-signin btn-signin--youtube" onClick={() => handleSignIn("youtube")}>
              Sign in with YouTube
            </button>
            <button className="btn-cancel" onClick={() => setSignInChoice(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Compose modal */}
      {compose && auth && (
        <ComposeModal
          auth={auth}
          onClose={() => setCompose(false)}
          onPublished={handlePublished}
        />
      )}

      <style>{`
        .feed-root {
          max-width: 720px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .feed-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .feed-toolbar-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .feed-heading {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 1.3rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #F9C424;
          border-left: 3px solid #F9C424;
          padding-left: 0.6rem;
        }
        .btn-make-post {
          background: #F9C424;
          border: none;
          color: #0d0d0d;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.3rem 0.9rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-make-post:hover { opacity: 0.88; }
        .feed-state {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.82rem;
          color: #555;
          padding: 2rem 0;
          text-align: center;
        }
        .feed-error { color: #ff6b6b; }
        .feed-empty { color: #444; }
        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* nav auth control */
        .auth-control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .auth-loading {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.72rem;
          color: #555;
        }
        .auth-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #333;
        }
        .auth-handle {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.72rem;
          color: #aaa;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .btn-nav {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #888;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.2rem 0.5rem;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .btn-nav:hover { border-color: #888; color: #e8e8e8; }
        .btn-nav--accent { border-color: #F9C424; color: #F9C424; }
        .btn-nav--accent:hover { background: #F9C424; color: #0d0d0d; }

        /* sign-in picker */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .signin-picker {
          background: #111;
          border: 1px solid #2a2a2a;
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          align-items: center;
          min-width: 260px;
        }
        .signin-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #aaa;
          margin-bottom: 0.25rem;
        }
        .btn-signin {
          width: 100%;
          border: none;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-signin:hover { opacity: 0.88; }
        .btn-signin--twitch { background: #9147ff; color: #fff; }
        .btn-signin--youtube { background: #ff0000; color: #fff; }
        .btn-cancel {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #555;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.75rem;
          padding: 0.3rem 0.75rem;
          cursor: pointer;
          margin-top: 0.25rem;
        }
        .btn-cancel:hover { color: #aaa; }
      `}</style>
    </main>
  );
}
