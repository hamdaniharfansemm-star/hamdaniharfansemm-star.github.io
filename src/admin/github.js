// Minimal GitHub REST client for the admin page.
// Every save becomes ONE commit on `main`, which triggers the deploy workflow.

export const REPO = {
  owner: "hamdaniharfansemm-star",
  repo: "hamdaniharfansemm-star.github.io",
  branch: "main",
};
export const CONTENT_PATH = "src/data/content.json";
export const UPLOAD_DIR = "public/assets/uploads";

const API = "https://api.github.com";
const R = `/repos/${REPO.owner}/${REPO.repo}`;

export class GitHubError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function gh(token, path, { method = "GET", body } = {}) {
  const res = await fetch(API + path, {
    method,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = (await res.json()).message || msg;
    } catch {
      /* ignore */
    }
    throw new GitHubError(res.status, msg);
  }
  return res.status === 204 ? null : res.json();
}

/* ---------- base64 helpers (UTF-8 safe) ---------- */
export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
export function base64ToUtf8(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/* ---------- API ---------- */

/** Checks the token: returns { login, avatar } or throws with a friendly message. */
export async function verifyToken(token) {
  let repo;
  try {
    repo = await gh(token, R);
  } catch (e) {
    if (e.status === 401) throw new Error("Token tidak valid atau sudah kedaluwarsa.");
    if (e.status === 404) throw new Error("Token tidak punya akses ke repo website. Pastikan repo-nya dipilih saat membuat token.");
    throw new Error(`GitHub error: ${e.message}`);
  }
  if (!repo.permissions?.push) {
    throw new Error("Token hanya bisa membaca. Ubah izin 'Contents' menjadi 'Read and write'.");
  }
  let user = { login: REPO.owner, avatar_url: "" };
  try {
    user = await gh(token, "/user");
  } catch {
    /* fine-grained tokens may not read /user — not required */
  }
  return { login: user.login, avatar: user.avatar_url };
}

/** Loads content.json from the latest commit on main. */
export async function loadContent(token) {
  const file = await gh(token, `${R}/contents/${CONTENT_PATH}?ref=${REPO.branch}&t=${Date.now()}`);
  const text = base64ToUtf8(file.content);
  return { data: JSON.parse(text), text, sha: file.sha };
}

/** Current blob sha of content.json on main (used to detect edits made elsewhere). */
export async function currentContentSha(token) {
  const file = await gh(token, `${R}/contents/${CONTENT_PATH}?ref=${REPO.branch}&t=${Date.now()}`);
  return file.sha;
}

/**
 * Creates a single commit containing content.json + any new images.
 * files: [{ path, content, encoding: "utf-8" | "base64" }]
 */
export async function commitFiles(token, files, message) {
  const ref = await gh(token, `${R}/git/ref/heads/${REPO.branch}`);
  const headSha = ref.object.sha;
  const head = await gh(token, `${R}/git/commits/${headSha}`);

  const tree = [];
  for (const f of files) {
    const blob = await gh(token, `${R}/git/blobs`, {
      method: "POST",
      body: { content: f.content, encoding: f.encoding },
    });
    tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const newTree = await gh(token, `${R}/git/trees`, {
    method: "POST",
    body: { base_tree: head.tree.sha, tree },
  });
  const commit = await gh(token, `${R}/git/commits`, {
    method: "POST",
    body: { message, tree: newTree.sha, parents: [headSha] },
  });
  await gh(token, `${R}/git/refs/heads/${REPO.branch}`, {
    method: "PATCH",
    body: { sha: commit.sha },
  });
  return commit.sha;
}

/** Latest deploy run for a commit, or null if Actions can't be read with this token. */
export async function deployRunFor(token, commitSha) {
  try {
    const res = await gh(token, `${R}/actions/runs?head_sha=${commitSha}&per_page=1`);
    return res.workflow_runs?.[0] || { status: "queued" };
  } catch {
    return null;
  }
}

export const links = {
  repo: `https://github.com/${REPO.owner}/${REPO.repo}`,
  actions: `https://github.com/${REPO.owner}/${REPO.repo}/actions`,
  site: `https://${REPO.owner}.github.io/`,
  newToken: "https://github.com/settings/personal-access-tokens/new",
  history: `https://github.com/${REPO.owner}/${REPO.repo}/commits/${REPO.branch}/${CONTENT_PATH}`,
};
