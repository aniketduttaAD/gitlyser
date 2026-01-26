import type { TimelineEvent } from "@/lib/github/types";

/**
 * GitHub Event types
 */
type GithubEvent = {
  id: string;
  type: string;
  created_at: string;
  repo?: {
    name: string;
    url?: string;
  };
  actor?: {
    login: string;
    avatar_url: string;
  };
  payload?: {
    action?: string;
    pull_request?: {
      title: string;
      html_url: string;
      number?: number;
    };
    issue?: {
      title: string;
      html_url: string;
      number?: number;
    };
    commits?: Array<{
      message: string;
      sha: string;
      url: string;
    }>;
    size?: number;
    ref?: string;
    ref_type?: string;
    description?: string;
    release?: {
      name: string;
      tag_name: string;
      html_url: string;
    };
  };
};

/**
 * Convert GitHub events to timeline events
 */
export function convertGithubEventsToTimeline(events: GithubEvent[]): TimelineEvent[] {
  const timelineEvents: TimelineEvent[] = [];

  events.forEach((event) => {
    let timelineEvent: TimelineEvent | null = null;

    switch (event.type) {
      case "PushEvent": {
        const ref = event.payload?.ref || "";
        const branchName = ref.replace(/^refs\/heads\//, "") || "default";

        const size = event.payload?.size;
        const commitsArray = event.payload?.commits;
        const commitsLength = commitsArray?.length ?? 0;

        let commitCount: number | null = null;

        if (typeof size === "number" && size > 0) {
          commitCount = size;
        } else if (commitsLength > 0) {
          commitCount = commitsLength;
        }

        const firstCommitMessage = commitsArray?.[0]?.message;

        let description = branchName !== "default" ? `to ${branchName}` : undefined;
        if (firstCommitMessage) {
          const cleanMessage = firstCommitMessage.split("\n")[0].trim();
          description = description
            ? `${description}: ${cleanMessage.length > 60 ? cleanMessage.substring(0, 60) + "..." : cleanMessage}`
            : cleanMessage.length > 80
              ? cleanMessage.substring(0, 80) + "..."
              : cleanMessage;
        } else if (branchName !== "default") {
          description = `to ${branchName}`;
        }

        let title: string;
        if (commitCount !== null && commitCount > 0) {
          title = `Pushed ${commitCount} commit${commitCount !== 1 ? "s" : ""}`;
        } else {
          title = branchName !== "default" ? `Pushed changes to ${branchName}` : "Pushed changes";
        }

        timelineEvent = {
          id: `${event.id}-push`,
          type: "commits",
          date: event.created_at,
          title,
          description,
          repo: event.repo?.name,
          url: event.repo?.url ? `${event.repo.url}/commits/${branchName}` : undefined,
          actor: event.actor
            ? {
                login: event.actor.login,
                avatar_url: event.actor.avatar_url,
              }
            : undefined,
        };
        break;
      }

      case "PullRequestEvent": {
        const action = event.payload?.action || "opened";
        const pr = event.payload?.pull_request;
        const prNumber = event.payload?.pull_request?.number;
        const actionLabel =
          action === "opened"
            ? "Opened"
            : action === "closed"
              ? "Closed"
              : action === "merged"
                ? "Merged"
                : action.charAt(0).toUpperCase() + action.slice(1);

        timelineEvent = {
          id: `${event.id}-pr`,
          type: "prs",
          date: event.created_at,
          title: prNumber
            ? `${actionLabel} PR #${prNumber}: ${pr?.title || "Untitled"}`
            : `${actionLabel} PR: ${pr?.title || "Untitled"}`,
          url: pr?.html_url,
          repo: event.repo?.name,
          actor: event.actor
            ? {
                login: event.actor.login,
                avatar_url: event.actor.avatar_url,
              }
            : undefined,
        };
        break;
      }

      case "IssuesEvent": {
        const action = event.payload?.action || "opened";
        const issue = event.payload?.issue;
        const issueNumber = event.payload?.issue?.number;
        const actionLabel =
          action === "opened"
            ? "Opened"
            : action === "closed"
              ? "Closed"
              : action === "reopened"
                ? "Reopened"
                : action.charAt(0).toUpperCase() + action.slice(1);

        timelineEvent = {
          id: `${event.id}-issue`,
          type: "issues",
          date: event.created_at,
          title: issueNumber
            ? `${actionLabel} issue #${issueNumber}: ${issue?.title || "Untitled"}`
            : `${actionLabel} issue: ${issue?.title || "Untitled"}`,
          url: issue?.html_url,
          repo: event.repo?.name,
          actor: event.actor
            ? {
                login: event.actor.login,
                avatar_url: event.actor.avatar_url,
              }
            : undefined,
        };
        break;
      }

      case "CreateEvent":
        timelineEvent = {
          id: `${event.id}-create`,
          type: "repos",
          date: event.created_at,
          title: `Created repository ${event.repo?.name || ""}`,
          repo: event.repo?.name,
          actor: event.actor
            ? {
                login: event.actor.login,
                avatar_url: event.actor.avatar_url,
              }
            : undefined,
        };
        break;

      case "WatchEvent":
        timelineEvent = {
          id: `${event.id}-star`,
          type: "stars",
          date: event.created_at,
          title: `Starred ${event.repo?.name || ""}`,
          repo: event.repo?.name,
          url: event.repo?.url,
          actor: event.actor
            ? {
                login: event.actor.login,
                avatar_url: event.actor.avatar_url,
              }
            : undefined,
        };
        break;

      case "ForkEvent":
        timelineEvent = {
          id: `${event.id}-fork`,
          type: "repos",
          date: event.created_at,
          title: `Forked ${event.repo?.name || ""}`,
          repo: event.repo?.name,
          url: event.repo?.url,
          actor: event.actor
            ? {
                login: event.actor.login,
                avatar_url: event.actor.avatar_url,
              }
            : undefined,
        };
        break;

      case "ReleaseEvent": {
        const release = event.payload?.release;
        timelineEvent = {
          id: `${event.id}-release`,
          type: "repos",
          date: event.created_at,
          title: release
            ? `Released ${release.tag_name}${release.name ? `: ${release.name}` : ""}`
            : `Released ${event.repo?.name || ""}`,
          description: release?.name || undefined,
          url: release?.html_url,
          repo: event.repo?.name,
          actor: event.actor
            ? {
                login: event.actor.login,
                avatar_url: event.actor.avatar_url,
              }
            : undefined,
        };
        break;
      }

      case "PublicEvent":
        timelineEvent = {
          id: `${event.id}-public`,
          type: "repos",
          date: event.created_at,
          title: `Made ${event.repo?.name || ""} public`,
          repo: event.repo?.name,
          url: event.repo?.url,
          actor: event.actor
            ? {
                login: event.actor.login,
                avatar_url: event.actor.avatar_url,
              }
            : undefined,
        };
        break;

      case "DeleteEvent": {
        const refType = event.payload?.ref_type || "branch";
        const ref = event.payload?.ref || "";
        timelineEvent = {
          id: `${event.id}-delete`,
          type: "repos",
          date: event.created_at,
          title: `Deleted ${refType} ${ref ? `${ref}` : ""} in ${event.repo?.name || ""}`,
          repo: event.repo?.name,
          actor: event.actor
            ? {
                login: event.actor.login,
                avatar_url: event.actor.avatar_url,
              }
            : undefined,
        };
        break;
      }
    }

    if (timelineEvent) {
      timelineEvents.push(timelineEvent);
    }
  });

  return timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Group timeline events by date
 */
export function groupTimelineEventsByDate(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const grouped = new Map<string, TimelineEvent[]>();

  events.forEach((event) => {
    const date = new Date(event.date).toISOString().split("T")[0];
    const existing = grouped.get(date) || [];
    grouped.set(date, [...existing, event]);
  });

  return grouped;
}
