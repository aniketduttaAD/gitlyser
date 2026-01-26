const GITHUB_API_BASE = "https://api.github.com";

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);

export class GithubApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Get GitHub authentication headers.
 *
 * SECURITY: This function is ONLY called server-side in API routes.
 * The GITHUB_TOKEN environment variable is NEVER exposed to client-side code.
 *
 * - Token is stored in Vercel environment variables (production)
 * - Token is stored in .env.local (development, gitignored)
 * - Token is NEVER included in client bundles or network responses
 * - App works gracefully without token (lower rate limits)
 *
 * @returns Authorization header object or empty object if no token
 */
const getAuthHeaders = () => {
  const token = process.env.GITHUB_TOKEN;

  if (!token || token.trim() === "") {
    return {};
  }

  return { Authorization: `Bearer ${token.trim()}` };
};

const parseError = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    return { error: "Failed to parse error response", details: String(error) };
  }
};

const requestGithub = async (path: string, init?: RequestInit, accept?: string) => {
  const headers = new Headers(init?.headers ?? {});
  Object.entries(DEFAULT_HEADERS).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });
  if (accept) {
    headers.set("Accept", accept);
  }
  Object.entries(getAuthHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return fetch(`${GITHUB_API_BASE}${path}`, { ...init, headers });
};

const requestWithRetry = async (path: string, init?: RequestInit, accept?: string, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await requestGithub(path, init, accept);
    if (response.ok || !RETRY_STATUS.has(response.status) || attempt === retries) {
      return response;
    }
    await sleep(400 * (attempt + 1));
  }
  return requestGithub(path, init, accept);
};

export const githubJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await requestWithRetry(path, init);
  if (!response.ok) {
    const details = await parseError(response);
    throw new GithubApiError(response.status, "GitHub API request failed.", details);
  }
  return response.json() as Promise<T>;
};

export const githubMaybeJson = async <T>(path: string, init?: RequestInit): Promise<T | null> => {
  const response = await requestWithRetry(path, init);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const details = await parseError(response);
    throw new GithubApiError(response.status, "GitHub API request failed.", details);
  }
  return response.json() as Promise<T>;
};

export const githubText = async (
  path: string,
  init?: RequestInit,
  accept = "application/vnd.github.raw"
): Promise<string> => {
  const response = await requestWithRetry(path, init, accept);
  if (!response.ok) {
    const details = await parseError(response);
    throw new GithubApiError(response.status, "GitHub API request failed.", details);
  }
  return response.text();
};

/**
 * Fetch raw file content from GitHub (base64 decoded)
 */
export const githubRaw = async (path: string, init?: RequestInit): Promise<string | null> => {
  try {
    const response = await requestWithRetry(path, init);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data.encoding === "base64" && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
};
