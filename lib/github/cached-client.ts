import { githubJson, githubMaybeJson, githubText, GithubApiError } from "./client";

/**
 * Wrapper for githubJson (caching removed)
 */
export async function cachedGithubJson<T>(
  path: string,
  _cacheKey: string,
  _ttl?: number,
  init?: RequestInit
): Promise<T> {
  return githubJson<T>(path, init);
}

/**
 * Wrapper for githubMaybeJson (caching removed)
 */
export async function cachedGithubMaybeJson<T>(
  path: string,
  _cacheKey: string,
  _ttl?: number,
  init?: RequestInit
): Promise<T | null> {
  return githubMaybeJson<T>(path, init);
}

/**
 * Wrapper for githubText (caching removed)
 */
export async function cachedGithubText(
  path: string,
  _cacheKey: string,
  _ttl?: number,
  accept: string = "application/vnd.github.raw",
  init?: RequestInit
): Promise<string | null> {
  try {
    return await githubText(path, init, accept);
  } catch (error) {
    if (error instanceof GithubApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
