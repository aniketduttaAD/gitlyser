import type { DependencyNode, DependencyEdge } from "@/lib/github/types";

export type ParsedDependencies = {
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  ecosystem: "npm" | "python" | "rust" | "go" | "ruby" | "unknown";
};

/**
 * Parse package.json
 */
export function parsePackageJson(content: string): ParsedDependencies | null {
  try {
    const pkg = JSON.parse(content);
    return {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      peerDependencies: pkg.peerDependencies || {},
      ecosystem: "npm",
    };
  } catch {
    return null;
  }
}

/**
 * Parse requirements.txt
 */
export function parseRequirementsTxt(content: string): ParsedDependencies | null {
  try {
    const dependencies: Record<string, string> = {};
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const match = trimmed.match(/^([a-zA-Z0-9_-]+[a-zA-Z0-9._-]*)([=<>!~]+)?(.+)?$/);
      if (match) {
        const name = match[1].toLowerCase();
        const version = match[3]?.trim() || "unknown";
        dependencies[name] = version;
      }
    }

    if (Object.keys(dependencies).length === 0) return null;

    return {
      dependencies,
      ecosystem: "python",
    };
  } catch {
    return null;
  }
}

/**
 * Parse pyproject.toml (Python)
 */
export function parsePyprojectToml(content: string): ParsedDependencies | null {
  try {
    const dependencies: Record<string, string> = {};

    const lines = content.split("\n");
    let inDependencies = false;
    let inDevDependencies = false;
    const devDependencies: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("[project.dependencies]") || trimmed.startsWith("[dependencies]")) {
        inDependencies = true;
        inDevDependencies = false;
        continue;
      }

      if (
        trimmed.startsWith("[project.optional-dependencies]") ||
        trimmed.startsWith("[tool.poetry.dev-dependencies]")
      ) {
        inDependencies = false;
        inDevDependencies = true;
        continue;
      }

      if (trimmed.startsWith("[") || trimmed.startsWith("#")) {
        inDependencies = false;
        inDevDependencies = false;
        continue;
      }

      if (inDependencies || inDevDependencies) {
        const match = trimmed.match(/^"?([^"]+)"?\s*=\s*"?([^"]+)"?/);
        if (match) {
          const name = match[1].replace(/"/g, "").trim();
          const version = match[2].replace(/"/g, "").trim();
          if (inDependencies) {
            dependencies[name] = version;
          } else {
            devDependencies[name] = version;
          }
        }
      }
    }

    if (Object.keys(dependencies).length === 0 && Object.keys(devDependencies).length === 0) {
      return null;
    }

    return {
      dependencies,
      devDependencies: Object.keys(devDependencies).length > 0 ? devDependencies : undefined,
      ecosystem: "python",
    };
  } catch {
    return null;
  }
}

/**
 * Parse Cargo.toml (Rust)
 */
export function parseCargoToml(content: string): ParsedDependencies | null {
  try {
    const dependencies: Record<string, string> = {};
    const lines = content.split("\n");
    let inDependencies = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("[dependencies]")) {
        inDependencies = true;
        continue;
      }

      if (trimmed.startsWith("[") && !trimmed.startsWith("[dependencies")) {
        inDependencies = false;
        continue;
      }

      if (inDependencies && trimmed && !trimmed.startsWith("#")) {
        const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*"([^"]+)"/);
        if (match) {
          dependencies[match[1]] = match[2];
        }
      }
    }

    if (Object.keys(dependencies).length === 0) return null;

    return {
      dependencies,
      ecosystem: "rust",
    };
  } catch {
    return null;
  }
}

/**
 * Parse go.mod (Go)
 */
export function parseGoMod(content: string): ParsedDependencies | null {
  try {
    const dependencies: Record<string, string> = {};
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("module ")) continue;

      const match = trimmed.match(/^require\s+([^\s]+)\s+([^\s]+)/);
      if (match) {
        dependencies[match[1]] = match[2];
      }
    }

    if (Object.keys(dependencies).length === 0) return null;

    return {
      dependencies,
      ecosystem: "go",
    };
  } catch {
    return null;
  }
}

/**
 * Parse Gemfile (Ruby)
 */
export function parseGemfile(content: string): ParsedDependencies | null {
  try {
    const dependencies: Record<string, string> = {};
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const match = trimmed.match(/^gem\s+['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"])?/);
      if (match) {
        dependencies[match[1]] = match[2] || "unknown";
      }
    }

    if (Object.keys(dependencies).length === 0) return null;

    return {
      dependencies,
      ecosystem: "ruby",
    };
  } catch {
    return null;
  }
}

/**
 * Build dependency graph from parsed dependencies
 */
export function buildDependencyGraph(
  parsed: ParsedDependencies,
  repoName: string
): { nodes: DependencyNode[]; edges: DependencyEdge[] } {
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];

  const rootId = `root-${repoName}`;
  nodes.push({
    id: rootId,
    name: repoName,
    version: "1.0.0",
    type: "root",
    ecosystem: parsed.ecosystem,
  });

  for (const [name, version] of Object.entries(parsed.dependencies || {})) {
    const depId = `dep-${name}`;
    if (!nodes.find((n) => n.id === depId)) {
      nodes.push({
        id: depId,
        name,
        version,
        type: "dependency",
        ecosystem: parsed.ecosystem,
      });
    }
    edges.push({
      source: rootId,
      target: depId,
      type: "direct",
    });
  }

  for (const [name, version] of Object.entries(parsed.devDependencies || {})) {
    const depId = `dev-${name}`;
    if (!nodes.find((n) => n.id === depId)) {
      nodes.push({
        id: depId,
        name,
        version,
        type: "devDependency",
        ecosystem: parsed.ecosystem,
      });
    }
    edges.push({
      source: rootId,
      target: depId,
      type: "direct",
    });
  }

  for (const [name, version] of Object.entries(parsed.peerDependencies || {})) {
    const depId = `peer-${name}`;
    if (!nodes.find((n) => n.id === depId)) {
      nodes.push({
        id: depId,
        name,
        version,
        type: "peerDependency",
        ecosystem: parsed.ecosystem,
      });
    }
    edges.push({
      source: rootId,
      target: depId,
      type: "direct",
    });
  }

  return { nodes, edges };
}
