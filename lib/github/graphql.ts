const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

/**
 * Get GitHub authentication headers for GraphQL.
 */
const getAuthHeaders = () => {
  const token = process.env.GITHUB_TOKEN;

  if (!token || token.trim() === "") {
    return {};
  }

  return { Authorization: `Bearer ${token.trim()}` };
};

/**
 * Execute a GraphQL query
 */
export async function githubGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const headers = new Headers(DEFAULT_HEADERS);
  Object.entries(getAuthHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "GraphQL request failed" }));
    throw new Error(error.message || `GraphQL request failed with status ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL query failed");
  }

  return result.data as T;
}
