import type {
  CollaborationNode,
  CollaborationEdge,
  CollaborationNetwork,
} from "@/lib/github/types";

type Contributor = {
  login: string;
  avatar_url: string;
  contributions: number;
};

type PRReview = {
  user: { login: string } | null;
  state: string;
};

type PullRequest = {
  user: { login: string } | null;
  number: number;
  reviews?: PRReview[];
};

/**
 * Build collaboration network
 */
export function buildCollaborationNetwork(
  contributors: Contributor[],
  prs: PullRequest[],
  repos: string[]
): CollaborationNetwork {
  const nodes: CollaborationNode[] = [];
  const edges: CollaborationEdge[] = [];
  const nodeMap = new Map<string, CollaborationNode>();
  const edgeMap = new Map<string, CollaborationEdge>();

  for (const contributor of contributors) {
    if (!nodeMap.has(contributor.login)) {
      const node: CollaborationNode = {
        id: contributor.login,
        login: contributor.login,
        avatar_url: contributor.avatar_url,
        contributions: contributor.contributions,
        repos: repos,
        type: "user",
      };
      nodes.push(node);
      nodeMap.set(contributor.login, node);
    } else {
      const existing = nodeMap.get(contributor.login)!;
      existing.contributions += contributor.contributions;
      existing.repos = [...new Set([...existing.repos, ...repos])];
    }
  }

  for (const pr of prs) {
    const author = pr.user?.login;
    if (!author) continue;

    if (!nodeMap.has(author)) {
      const node: CollaborationNode = {
        id: author,
        login: author,
        avatar_url: `https://github.com/${author}.png`,
        contributions: 0,
        repos: repos,
        type: "user",
      };
      nodes.push(node);
      nodeMap.set(author, node);
    }

    if (pr.reviews) {
      for (const review of pr.reviews) {
        const reviewer = review.user?.login;
        if (!reviewer || reviewer === author) continue;

        if (!nodeMap.has(reviewer)) {
          const node: CollaborationNode = {
            id: reviewer,
            login: reviewer,
            avatar_url: `https://github.com/${reviewer}.png`,
            contributions: 0,
            repos: repos,
            type: "user",
          };
          nodes.push(node);
          nodeMap.set(reviewer, node);
        }

        const edgeKey = [author, reviewer].sort().join("-");
        if (edgeMap.has(edgeKey)) {
          const edge = edgeMap.get(edgeKey)!;
          edge.weight += 1;
          if (!edge.repos.includes(repos[0])) {
            edge.repos.push(repos[0]);
          }
          if (!edge.types.includes("review")) {
            edge.types.push("review");
          }
        } else {
          const edge: CollaborationEdge = {
            source: author,
            target: reviewer,
            weight: 1,
            repos: [repos[0]],
            types: ["review"],
          };
          edges.push(edge);
          edgeMap.set(edgeKey, edge);
        }
      }
    }
  }

  const limitedNodes = nodes.slice(0, 50).sort((a, b) => b.contributions - a.contributions);
  const limitedEdges = edges
    .filter(
      (e) =>
        limitedNodes.some((n) => n.id === e.source) && limitedNodes.some((n) => n.id === e.target)
    )
    .slice(0, 100)
    .sort((a, b) => b.weight - a.weight);

  const mostActive =
    limitedNodes.length > 0
      ? { login: limitedNodes[0].login, contributions: limitedNodes[0].contributions }
      : null;

  return {
    nodes: limitedNodes,
    edges: limitedEdges,
    totalCollaborators: limitedNodes.length,
    totalRepos: repos.length,
    mostActiveCollaborator: mostActive,
  };
}
