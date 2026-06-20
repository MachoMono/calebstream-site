const API = "https://calebstillstreams-webhook-if2erxe6bq-uc.a.run.app";

export interface Post {
  id: string;
  handle: string;
  platform: string;
  avatar_url: string | null;
  title: string | null;
  body_html: string | null;
  message: string | null; // legacy plain-text
  tags: string[];
  word_count: number | null;
  ts: string;
}

export async function getPosts(): Promise<Post[]> {
  const res = await fetch(`${API}/guestbook`);
  if (!res.ok) throw new Error(`Failed to load posts: ${res.status}`);
  const data = await res.json();
  return data.messages as Post[];
}

export interface NewPost {
  provider: string;
  token: string;
  title?: string;
  body_html: string;
  tags: string[];
}

export async function createPost(post: NewPost): Promise<void> {
  const res = await fetch(`${API}/guestbook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
  if (res.status === 401) throw new Error("AUTH_EXPIRED");
  if (res.status === 429) throw new Error("RATE_LIMITED");
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail || `Error ${res.status}`);
  }
}
