const TWITCH_CLIENT_ID = "usmetfnk74m2ciy5a74dzowuxe6m34";
const TWITCH_REDIRECT = "https://calebstream.fyi";
const GOOGLE_CLIENT_ID = "260028688843-rf4tijqkfig09pli4reqo9a632akbim5.apps.googleusercontent.com";

export type Provider = "twitch" | "youtube";

export interface AuthState {
  provider: Provider;
  token: string;
  handle: string;
  avatarUrl: string | null;
}

const KEY = "calebstream_auth";

export function getAuth(): AuthState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function setAuth(state: AuthState) {
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function clearAuth() {
  sessionStorage.removeItem(KEY);
}

// ── Twitch implicit grant ────────────────────────────────────────────────────

export function loginWithTwitch() {
  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: TWITCH_REDIRECT,
    response_type: "token",
    scope: "user:read:email",
  });
  window.location.href = `https://id.twitch.tv/oauth2/authorize?${params}`;
}

/** Parse #access_token from the URL hash after Twitch redirect. Returns token or null. */
export function parseTwitchCallback(): string | null {
  if (!window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("access_token");
  if (token) {
    // Strip the hash so it doesn't linger in the URL
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  return token;
}

// ── Google Identity Services ─────────────────────────────────────────────────

type GsiCallback = (response: { credential: string }) => void;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: { client_id: string; callback: GsiCallback; auto_select?: boolean }) => void;
          prompt: (cb?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function loginWithGoogle(onCredential: (credential: string) => void) {
  const tryInit = () => {
    if (!window.google?.accounts?.id) {
      setTimeout(tryInit, 200);
      return;
    }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => onCredential(resp.credential),
    });
    window.google.accounts.id.prompt();
  };
  tryInit();
}
